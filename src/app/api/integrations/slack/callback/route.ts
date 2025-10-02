import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const state = searchParams.get("state");

	if (!code || !state) {
		return NextResponse.redirect(
			new URL(
				"/dashboard/integrations?error=slack_auth_failed",
				request.url
			)
		);
	}

	try {
		// Decode state to get user ID
		const { userId } = JSON.parse(Buffer.from(state, "base64").toString());

		// Exchange code for access token
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
					redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
				}),
			}
		);

		const tokenData = await tokenResponse.json();

		if (!tokenData.ok) {
			throw new Error("Failed to exchange code for token");
		}

		// Store Slack credentials in database

		// await supabase.from("cdm_integrations").upsert({
		// 	user_id: userId,
		// 	integration_type: "slack",
		// 	access_token: tokenData.access_token,
		// 	team_id: tokenData.team.id,
		// 	team_name: tokenData.team.name,
		// 	bot_user_id: tokenData.bot_user_id,
		// 	metadata: {
		// 		scope: tokenData.scope,
		// 		app_id: tokenData.app_id,
		// 	},
		// 	connected_at: new Date().toISOString(),
		// });

		return NextResponse.redirect(
			new URL("/dashboard/integrations/slack", request.url)
		);
	} catch (error) {
		console.error("[v0] Slack OAuth error:", error);
		return NextResponse.redirect(
			new URL(
				"/dashboard/integrations?error=slack_auth_failed",
				request.url
			)
		);
	}
}
