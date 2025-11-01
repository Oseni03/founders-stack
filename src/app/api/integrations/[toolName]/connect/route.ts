/* eslint-disable @typescript-eslint/no-explicit-any */
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { OAUTH_CONFIG, ToolName } from "@/lib/oauth-utils";
import { z } from "zod";
import { connectPostHogIntegration } from "@/lib/connectors/posthog";
import { connectStripeIntegration } from "@/lib/connectors/stripe";
import { connectAsanaIntegration } from "@/lib/connectors/asana";
import { connectCannyIntegration } from "@/lib/connectors/canny";

// Configuration for API-key based integrations
const API_KEY_INTEGRATIONS = {
	posthog: {
		handler: connectPostHogIntegration as (params: any) => Promise<any>,
		redirectPath: "/integrations/analytics",
		requiredFields: ["apiKey", "projectId"] as const,
		mapParams: (body: any, user: any) => ({
			projectId: body.projectId,
			organizationId: user.organizationId,
			apiKey: body.apiKey,
			displayName: body.projectName,
			userId: user.id,
			webhookConfirmed: body.webhookConfirmed || false,
		}),
	},
	stripe: {
		handler: connectStripeIntegration as (params: any) => Promise<any>,
		redirectPath: "/integrations/finance",
		requiredFields: ["apiKey"] as const,
		mapParams: (body: any, user: any) => ({
			userId: user.id,
			organizationId: user.organizationId,
			apiKey: body.apiKey,
		}),
	},
	asana: {
		handler: connectAsanaIntegration as (params: any) => Promise<any>,
		redirectPath: (toolName: string) =>
			`/integrations/${toolName}/onboarding`,
		requiredFields: ["apiKey"] as const,
		mapParams: (body: any, user: any) => ({
			userId: user.id,
			organizationId: user.organizationId,
			apiKey: body.apiKey,
		}),
	},
	canny: {
		handler: connectCannyIntegration as (params: any) => Promise<any>,
		redirectPath: (toolName: string) =>
			`/integrations/${toolName}/onboarding`,
		requiredFields: ["apiKey"] as const,
		mapParams: (body: any, user: any) => ({
			userId: user.id,
			organizationId: user.organizationId,
			apiKey: body.apiKey,
		}),
	},
} as const;

type ApiKeyToolName = keyof typeof API_KEY_INTEGRATIONS;

function isApiKeyIntegration(toolName: string): toolName is ApiKeyToolName {
	return toolName in API_KEY_INTEGRATIONS;
}

// OAuth URL builders for special cases
const OAUTH_PARAM_BUILDERS = {
	jira: (authUrl: URL) => {
		authUrl.searchParams.set("audience", "api.atlassian.com");
	},
	slack: (authUrl: URL, config: any) => {
		authUrl.searchParams.set("scope", ""); // Bot scopes
		authUrl.searchParams.set("user_scope", config.userScopes.join(","));
	},
	default: (authUrl: URL, config: any) => {
		if ("scopes" in config) {
			authUrl.searchParams.set("scope", config.scopes.join(" "));
		}
	},
} as const;

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

			// Apply tool-specific OAuth parameters
			const paramBuilder =
				OAUTH_PARAM_BUILDERS[
					toolName as keyof typeof OAUTH_PARAM_BUILDERS
				] || OAUTH_PARAM_BUILDERS.default;
			paramBuilder(authUrl, config);

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

			// Check if this is an API-key based integration
			if (!isApiKeyIntegration(toolName)) {
				return NextResponse.json(
					{
						error: `Integration for ${toolName} is not implemented yet.`,
					},
					{ status: 400 }
				);
			}

			const integration = API_KEY_INTEGRATIONS[toolName];

			// Validate required fields
			for (const field of integration.requiredFields) {
				if (!body[field]) {
					const fieldName =
						field === "apiKey"
							? "API key"
							: field.replace(/([A-Z])/g, " $1").toLowerCase();
					return NextResponse.json(
						{
							error: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
						},
						{ status: 400 }
					);
				}
			}

			// Map parameters and call the handler
			const params = integration.mapParams(body, user);
			const response = await integration.handler(params);

			// Handle successful connection with redirect
			if (response.status === "CONNECTED") {
				const redirectPath =
					typeof integration.redirectPath === "function"
						? integration.redirectPath(toolName)
						: integration.redirectPath;

				const redirectUrl = new URL(redirectPath, request.url);
				return NextResponse.redirect(redirectUrl, 303);
			}

			// Return success response without redirect
			return NextResponse.json({
				status: response.status,
				message:
					response.message || `${toolName} connected successfully`,
			});
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
