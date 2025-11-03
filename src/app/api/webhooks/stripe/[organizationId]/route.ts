/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { StripeConnector } from "@/lib/connectors/stripe";
import { determineEventCategory } from "@/lib/stripe-utils";

/**
 * POST handler for Stripe webhooks
 * Route: /api/webhooks/stripe/[organizationId]
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ organizationId: string }> }
) {
	const { organizationId } = await params;

	try {
		// Step 1: Get integration from database
		const integration = await prisma.integration.findFirst({
			where: {
				organizationId,
				toolName: "stripe",
				status: { in: ["CONNECTED", "SYNCING"] },
			},
		});

		if (!integration) {
			console.warn("Stripe webhook received for unknown integration", {
				organizationId,
			});
			return NextResponse.json(
				{ error: "Integration not found" },
				{ status: 404 }
			);
		}

		// Step 2: Verify webhook signature
		const body = await request.text();
		const headersList = await headers();
		const signature = headersList.get("stripe-signature");

		if (!signature) {
			console.error("Missing Stripe signature");
			return NextResponse.json(
				{ error: "Missing signature" },
				{ status: 400 }
			);
		}

		const connector = new StripeConnector(integration.apiKey!);

		let event: Stripe.Event;

		try {
			event = await connector.constructEvent(
				body,
				signature,
				integration.webhookSecret!
			);
		} catch (err) {
			console.error("Webhook signature verification failed:", err);
			return NextResponse.json(
				{ error: "Invalid signature" },
				{ status: 400 }
			);
		}

		console.log(`Received Stripe event: ${event.type} (${event.id})`);

		// Step 3: Store raw event in database
		const storedEvent = await prisma.event.create({
			data: {
				organizationId,
				externalId: event.id,
				sourceTool: "stripe",
				type: event.type,
				category: determineEventCategory(event.type),
				status: "pending",
				data: event as any,
				createdAt: new Date(event.created * 1000),
			},
		});

		// Step 4: Process event asynchronously (don't wait)
		await StripeConnector.processStripeEvent(event, organizationId).catch(
			(error) => {
				console.error(`Failed to process event ${event.id}:`, error);
				// Update event status to failed
				prisma.event.update({
					where: { id: storedEvent.id },
					data: {
						status: "failed",
						data: { error: error.message },
					},
				});
			}
		);

		// Step 5: Update last sync time
		await prisma.integration.update({
			where: { id: integration.id },
			data: { lastSyncAt: new Date() },
		});

		// Step 6: Return success immediately (within 5 seconds)
		return NextResponse.json({ received: true }, { status: 200 });
	} catch (error) {
		console.error("Webhook processing error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// ============================================================================
// OPTIONAL: GET HANDLER FOR WEBHOOK VERIFICATION
// ============================================================================

/**
 * GET handler - Some platforms use GET to verify webhook endpoints
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ organizationId: string }> }
) {
	const { organizationId } = await params;
	return NextResponse.json(
		{
			status: "ok",
			message: "Stripe webhook endpoint",
			organizationId,
		},
		{ status: 200 }
	);
}
