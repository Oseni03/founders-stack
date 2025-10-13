/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { z } from "zod";
import { createAPIIntegration } from "@/server/integrations";
import { IntegrationCategory, IntegrationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PostHogConnector } from "@/lib/connectors/posthog";

// Should be POST, not GET (you're creating/modifying resources)
export async function POST(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			// Parse request body
			const body = await request.json();

			// Validate input
			const { apiKey, projectId, projectName } = body;

			// Test API key and fetch events
			const connector = new PostHogConnector(apiKey, projectId);

			let events;
			try {
				events = await connector.getEvents();
			} catch (error: any) {
				// Check if it's an authentication error from PostHog
				if (
					error.message?.includes("401") ||
					error.message?.includes("authentication") ||
					error.message?.includes("invalid")
				) {
					return NextResponse.json(
						{
							error: "Invalid PostHog API key",
							details:
								"The API key you provided is invalid. You can find your project API key in PostHog project settings.",
						},
						{ status: 401 }
					);
				}
				throw error;
			}

			// Upsert project
			const project = await prisma.project.upsert({
				where: {
					externalId_sourceTool: {
						externalId: projectId,
						sourceTool: "posthog",
					},
				},
				update: {
					name: projectName,
					updatedAt: new Date(),
				},
				create: {
					organizationId: user.organizationId,
					name: projectName,
					externalId: projectId,
					sourceTool: "posthog",
				},
			});

			// Store integration and events in a single transaction
			const result = await prisma.$transaction(async (tx) => {
				// Create/update integration
				const integration = await createAPIIntegration(
					user.organizationId,
					user.id,
					{
						toolName: "posthog",
						providerId: "posthog",
						apiKey,
						category: IntegrationCategory.analytics,
						status: IntegrationStatus.active,
					}
				);

				// Only insert events if there are any
				let eventsCreated = { count: 0 };
				if (events && events.length > 0) {
					eventsCreated = await tx.analyticsEvent.createMany({
						data: events.map((event) => ({
							...event,
							sourceTool: "posthog",
							organizationId: user.organizationId,
							projectId: project.id,
							attributes: null,
						})),
						skipDuplicates: true,
					});
				}

				return { integration, eventsCreated };
			});

			return NextResponse.json(
				{
					success: true,
					integration: result.integration,
					project: {
						id: project.id,
						name: project.name,
						externalId: project.externalId,
					},
					stats: {
						eventsTotal: events?.length || 0,
						eventsCreated: result.eventsCreated.count,
					},
					message:
						events?.length === 0
							? "PostHog connected successfully. No events found yet."
							: `PostHog connected successfully. ${result.eventsCreated.count} events synced.`,
				},
				{ status: 201 }
			);
		} catch (error) {
			// Enhanced error handling with specific error types
			if (error instanceof z.ZodError) {
				return NextResponse.json(
					{
						error: "Validation failed",
						details: error.issues.map((e) => ({
							field: e.path.join("."),
							message: e.message,
						})),
					},
					{ status: 400 }
				);
			}

			// Handle Prisma unique constraint violations
			if (
				error instanceof Error &&
				error.message.includes("Unique constraint")
			) {
				return NextResponse.json(
					{
						error: "Integration already exists for this organization",
					},
					{ status: 409 }
				);
			}

			// Generic error handler
			console.error("PostHog connection error:", error);
			return NextResponse.json(
				{
					error: "Failed to connect PostHog integration",
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				{ status: 500 }
			);
		}
	});
}
