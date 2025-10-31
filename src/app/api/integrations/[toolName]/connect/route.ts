import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { OAUTH_CONFIG, ToolName } from "@/lib/oauth-utils";
import { z } from "zod";
import { connectPostHogIntegration } from "@/lib/connectors/posthog";
import { connectStripeIntegration } from "@/lib/connectors/stripe";

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

			const { apiKey, projectId, projectName, webhookConfirmed } = body;

			if (!apiKey) {
				return NextResponse.json(
					{ error: "API key is required" },
					{ status: 400 }
				);
			}

			// Route to specific integration handler based on toolName
			switch (toolName) {
				case "posthog":
					if (!projectId) {
						return NextResponse.json(
							{ error: "Project ID is required" },
							{ status: 400 }
						);
					}
					const resp = await connectPostHogIntegration({
						projectId,
						organizationId: user.organizationId,
						apiKey,
						displayName: projectName,
						userId: user.id,
						webhookConfirmed: webhookConfirmed || false,
					});
					return NextResponse.json({
						success: resp.status,
						message:
							resp.message || `Stripe connected successfully`,
					});

				case "stripe":
					await connectStripeIntegration({
						userId: user.id,
						organizationId: user.organizationId,
						apiKey: apiKey,
					});
					return NextResponse.json({
						success: true,
						message: `Stripe connected successfully`,
					});

				default:
					// Default API key integration handler (like Stripe)
					return NextResponse.json({
						error: `Integration for ${toolName} is not implemented yet.`,
					});
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
