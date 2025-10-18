import { auth } from "@/lib/auth";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user, session) => {
		const { toolName } = await params;
		try {
			// OAuth flow - redirect to provider's authorization URL

			if (toolName !== "slack") {
				const data = await auth.api.oAuth2LinkAccount({
					body: {
						providerId: toolName,
						callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/${toolName}/onboarding`,
					},
					use: [
						async () => {
							// The middleware receives a context object
							// You need to return the session object with both session and user
							return {
								session: {
									session: session, // Your session object
									user: user, // Your user object
								},
							};
						},
					],
					// This endpoint requires session cookies.
					headers: await headers(),
				});

				return NextResponse.json(data);
			} else {
				// Generate a state parameter for CSRF protection
				const state = crypto.randomUUID();

				// Store state in session/database associated with userId
				await prisma.oAuthTemp.upsert({
					where: {
						userId_provider: {
							userId: user.id,
							provider: "slack",
						},
					},
					update: { state },
					create: {
						userId: user.id,
						provider: "slack",
						state,
                        expiresAt: new Date()
					},
				});

				const slackAuthUrl = new URL(
					"https://slack.com/oauth/v2/authorize"
				);
				slackAuthUrl.searchParams.set(
					"client_id",
					process.env.SLACK_CLIENT_ID!
				);
				slackAuthUrl.searchParams.set("scope", ""); // Leave empty for bot scopes
				slackAuthUrl.searchParams.set(
					"user_scope",
					[
						"channels:history",
						"channels:read",
						"chat:write",
						"groups:read",
						"im:read",
						"mpim:read",
						"im:history",
						"mpim:history",
						"users:read",
						"users:read.email",
					].join(",")
				);
				slackAuthUrl.searchParams.set(
					"redirect_uri",
					`${process.env.NEXT_PUBLIC_APP_URL}/api/oauth2/callback/slack`
				);
				slackAuthUrl.searchParams.set("state", state);

				return NextResponse.redirect(slackAuthUrl.toString());
			}
		} catch (error) {
			console.error(`Failed to connect ${toolName}`, error);
			return NextResponse.json(
				{ error: `Failed to fetch conect ${toolName}` },
				{ status: 500 }
			);
		}
	});
}
