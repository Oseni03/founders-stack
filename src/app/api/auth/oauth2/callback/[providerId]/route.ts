/* eslint-disable @typescript-eslint/no-explicit-any */
import { withAuth } from "@/lib/middleware";
import { OAUTH_CONFIG, OAuthConfig } from "@/lib/oauth-utils";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ providerId: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { providerId: provider } = await params;
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		// Check if provider is supported
		if (!(provider in OAUTH_CONFIG)) {
			return NextResponse.redirect(
				new URL(
					`/dashboard/integrations?error=unsupported_provider`,
					request.url
				)
			);
		}

		const config = OAUTH_CONFIG[provider];

		// Handle OAuth errors from provider
		if (error) {
			return NextResponse.redirect(
				new URL(
					`/dashboard/integrations?error=${encodeURIComponent(error)}`,
					request.url
				)
			);
		}

		// Validate required parameters
		if (!code || !state) {
			return NextResponse.redirect(
				new URL(
					"/dashboard/integrations?error=missing_parameters",
					request.url
				)
			);
		}

		// Verify state parameter for CSRF protection
		const temp = await prisma.oAuthTemp.findUnique({
			where: {
				userId_provider: {
					userId: user.id,
					provider: provider,
				},
			},
		});

		if (!temp || temp.state !== state) {
			return NextResponse.redirect(
				new URL(
					"/dashboard/integrations?error=invalid_state",
					request.url
				)
			);
		}

		// Check if state has expired (10 minutes)
		if (temp.expiresAt < new Date()) {
			await prisma.oAuthTemp.delete({
				where: {
					userId_provider: {
						userId: user.id,
						provider: provider,
					},
				},
			});

			return NextResponse.redirect(
				new URL(
					"/dashboard/integrations?error=state_expired",
					request.url
				)
			);
		}

		try {
			// Exchange authorization code for access token
			const tokenResponse = await exchangeCodeForTokens(
				provider,
				config,
				code
			);

			if (!tokenResponse) {
				throw new Error(
					tokenResponse.error || "Failed to exchange code for tokens"
				);
			}

			// Extract tokens based on provider
			const { accessToken, refreshToken, scope, resourceServer } =
				extractTokens(provider, tokenResponse);

			// Store the account and integration in database
			const accountId = createId();

			const account = await prisma.account.create({
				data: {
					id: createId(),
					accountId,
					accessToken,
					refreshToken: refreshToken || null,
					scope,
					providerId: provider,
					userId: user.id,
				},
			});

			const integration = await prisma.integration.upsert({
				where: {
					organizationId_toolName: {
						organizationId: user.organizationId,
						toolName: provider,
					},
				},
				update: {
					status: "active",
					type: "oauth2",
					accountId: account.id,
					category: config.category,
					attributes: {
						baseUrl: resourceServer,
					},
				},
				create: {
					category: config.category,
					status: "active",
					toolName: provider,
					type: "oauth2",
					organizationId: user.organizationId,
					accountId: account.id,
					attributes: {
						baseUrl: resourceServer,
					},
				},
			});

			// Clean up temporary state
			await prisma.oAuthTemp.delete({
				where: {
					userId_provider: {
						userId: user.id,
						provider: provider,
					},
				},
			});

			console.log(`${provider} integration saved:`, integration);

			// Redirect to integration onboarding page
			return NextResponse.redirect(
				new URL(
					`/dashboard/integrations/${provider}/onboarding`,
					request.url
				)
			);
		} catch (error) {
			console.error(`${provider} OAuth error:`, error);
			return NextResponse.redirect(
				new URL(
					`/dashboard/integrations?error=${encodeURIComponent(
						error instanceof Error ? error.message : "oauth_failed"
					)}`,
					request.url
				)
			);
		}
	});
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(
	provider: string,
	config: OAuthConfig,
	code: string
) {
	// Prepare token request based on provider
	const tokenParams: Record<string, string> = {
		client_id: config.clientId,
		client_secret: config.clientSecret,
		code,
		redirect_uri: config.redirectURI,
	};

	// Add grant_type for standard OAuth2 providers
	if (provider !== "slack") {
		tokenParams.grant_type = "authorization_code";
	}

	const response = await fetch(config.tokenUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			...(provider === "github" && { Accept: "application/json" }),
		},
		body: new URLSearchParams(tokenParams),
	});

	return await response.json();
}

// Extract tokens from provider response
function extractTokens(provider: string, tokenResponse: any) {
	switch (provider) {
		case "slack":
			return {
				accessToken: tokenResponse.authed_user.access_token,
				refreshToken: tokenResponse.authed_user.refresh_token,
				scope: tokenResponse.authed_user.scope,
				ok: tokenResponse.ok,
			};
		case "jira":
			return {
				accessToken: tokenResponse.access_token,
				refreshToken: tokenResponse.refresh_token,
				scope: tokenResponse.scope,
				resourceServer: tokenResponse.resource_server,
				ok: !!tokenResponse.access_token,
			};

		default:
			// Standard OAuth2 response format
			return {
				accessToken: tokenResponse.access_token,
				refreshToken: tokenResponse.refresh_token,
				scope: tokenResponse.scope,
				ok: !!tokenResponse.access_token,
			};
	}
}
