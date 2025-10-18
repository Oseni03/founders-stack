// app/api/slack/callback/route.ts
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		if (error) {
			return NextResponse.redirect(
				new URL(
					`/dashboard/integrations?error=${encodeURIComponent(error)}`,
					request.url
				)
			);
		}

		if (!code || !state) {
			return NextResponse.redirect(
				new URL(
					"/dashboard/integrations?error=missing_parameters",
					request.url
				)
			);
		}

		// Verify state parameter
		const temp = await prisma.oAuthTemp.findUnique({
			where: {
				userId_provider: {
					userId: user.id,
					provider: "slack",
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

		try {
			// Exchange code for tokens
			const tokenResponse = await fetch(
				"https://slack.com/api/oauth.v2.access",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						client_id: process.env.SLACK_CLIENT_ID!,
						client_secret: process.env.SLACK_CLIENT_SECRET!,
						code,
						redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth2/callback/slack`,
					}),
				}
			);

			const tokens = await tokenResponse.json();
			console.log("Slack tokens:", tokens);

			if (!tokens.ok) {
				throw new Error(
					tokens.error || "Failed to exchange code for tokens"
				);
			}

			// Store the tokens in your database
			const accountId = createId();

			const account = await prisma.account.create({
				data: {
					id: createId(),
					accountId,
					accessToken: tokens.authed_user.access_token,
					scope: tokens.authed_user.scope,
					providerId: "slack",
					userId: user.id,
				},
			});
			const integration = await prisma.integration.create({
				data: {
					category: "communication",
					status: "active",
					toolName: "slack",
					type: "oauth2",
					organizationId: user.organizationId,
					accountId: account.id,
				},
			});

			// Save to database
			// await db.slackIntegrations.create(slackIntegration);

			console.log("Slack integration saved:", integration);

			return NextResponse.redirect(
				new URL("/dashboard/integration/slack/onboarding", request.url)
			);
		} catch (error) {
			console.error("Slack OAuth error:", error);
			return NextResponse.redirect(
				new URL(
					`/dashboard/integrations?error=${encodeURIComponent(error as string)}`,
					request.url
				)
			);
		}
	});
}
