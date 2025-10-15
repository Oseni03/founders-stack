import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { z } from "zod";
import { createAPIIntegration } from "@/server/integrations";
import { IntegrationCategory, IntegrationStatus } from "@prisma/client";
import { syncStripe } from "@/lib/connectors/stripe";

// Should be POST, not GET (you're creating/modifying resources)
export async function POST(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			// Parse request body
			const body = await request.json();

			// Validate input
			const { apiKey } = body;

			await syncStripe(user.organizationId, apiKey);

			// Store integration and events in a single transaction
			const integration = await createAPIIntegration(
				user.organizationId,
				user.id,
				{
					toolName: "stripe",
					providerId: "stripe",
					apiKey,
					category: IntegrationCategory.payment,
					status: IntegrationStatus.active,
				}
			);

			return NextResponse.json(
				{
					success: true,
					integration: integration,
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
