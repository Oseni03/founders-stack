/* eslint-disable @typescript-eslint/no-explicit-any */
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	getIntegrationCategory,
	OAUTH_CONFIG,
	ToolName,
} from "@/lib/oauth-utils";
import { z } from "zod";
import { createAPIIntegration } from "@/server/integrations";
import { PostHogConnector } from "@/lib/connectors/posthog";
import { IntegrationCategory, IntegrationStatus } from "@prisma/client";
import { syncStripe } from "@/lib/connectors/stripe";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;

		try {
			// Check if the tool is supported
			if (!(toolName in OAUTH_CONFIG)) {
				return NextResponse.json(
					{ error: `Unsupported integration: ${toolName}` },
					{ status: 400 }
				);
			}

			const config = OAUTH_CONFIG[toolName as ToolName];

			// Generate a state parameter for CSRF protection
			const state = crypto.randomUUID();

			// Store state in database associated with userId
			await prisma.oAuthTemp.upsert({
				where: {
					userId_provider: {
						userId: user.id,
						provider: toolName,
					},
				},
				update: {
					state,
					expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
				},
				create: {
					userId: user.id,
					provider: toolName,
					state,
					expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
				},
			});

			// Build authorization URL
			const authUrl = new URL(config.authorizationUrl);
			authUrl.searchParams.set("client_id", config.clientId);
			authUrl.searchParams.set("redirect_uri", config.redirectURI);
			authUrl.searchParams.set("state", state);
			authUrl.searchParams.set("response_type", "code");
			authUrl.searchParams.set("prompt", "consent");

			if (toolName === "jira") {
				authUrl.searchParams.set("audience", "api.atlassian.com");
			}

			// Handle provider-specific parameters
			if (toolName === "slack" && "userScopes" in config) {
				authUrl.searchParams.set("scope", ""); // Bot scopes
				authUrl.searchParams.set(
					"user_scope",
					config.userScopes.join(",")
				);
			} else if ("scopes" in config) {
				// Standard OAuth providers (GitHub, Asana)
				authUrl.searchParams.set("scope", config.scopes.join(" "));
			}

			return NextResponse.json({ url: authUrl.toString() });
		} catch (error) {
			console.error(`Failed to initiate OAuth for ${toolName}:`, error);
			return NextResponse.json(
				{ error: `Failed to connect ${toolName}` },
				{ status: 500 }
			);
		}
	});
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;

		try {
			// Parse the credentials from request body
			const body = await request.json();

			// Validate that credentials exist
			if (!body || Object.keys(body).length === 0) {
				return NextResponse.json(
					{ error: "Credentials are required" },
					{ status: 400 }
				);
			}

			// Route to specific integration handler based on toolName
			switch (toolName) {
				case "posthog":
					return await handlePostHogIntegration(body, user);

				default:
					// Default API key integration handler (like Stripe)
					return await handleDefaultAPIIntegration(
						request,
						body,
						user,
						toolName
					);
			}
		} catch (error) {
			console.error(`Failed to connect ${toolName} with API key:`, error);

			// Enhanced error handling
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

			return NextResponse.json(
				{
					error: `Failed to connect ${toolName}`,
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

// PostHog integration handler
async function handlePostHogIntegration(body: any, user: any) {
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
}

// Default API key integration handler (Stripe, etc.)
async function handleDefaultAPIIntegration(
	request: NextRequest,
	body: any,
	user: any,
	toolName: string
) {
	const { apiKey } = body;

	if (!apiKey) {
		return NextResponse.json(
			{ error: "API key is required" },
			{ status: 400 }
		);
	}

	const category = getIntegrationCategory(toolName);

	// Store integration
	const integration = await createAPIIntegration(
		user.organizationId,
		user.id,
		{
			toolName,
			providerId: toolName,
			apiKey,
			category,
			status: IntegrationStatus.active,
		}
	);

	// Run tool-specific sync if function exists
	if (toolName === "stripe") {
		await syncStripe(user.organizationId, apiKey);
	} else if (toolName === "asana") {
		const origin = new URL(request.url).origin;
		return NextResponse.redirect(
			new URL(`/dashboard/integrations/${toolName}/onboarding`, origin)
		);
	}

	return NextResponse.json(
		{
			success: true,
			integration: integration,
			message: `${toolName.charAt(0).toUpperCase() + toolName.slice(1)} connected successfully`,
		},
		{ status: 201 }
	);
}
