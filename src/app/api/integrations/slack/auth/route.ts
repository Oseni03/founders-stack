import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
	const session = await getSession();

	if (!session?.user) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Slack OAuth configuration
	const clientId = process.env.SLACK_CLIENT_ID;
	const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`;
	const scopes = [
		"channels:history",
		"channels:read",
		"chat:write",
		"users:read",
		"team:read",
		"groups:history",
		"groups:read",
	].join(",");

	// Store user ID in state for callback
	const state = Buffer.from(
		JSON.stringify({ userId: session.user.id })
	).toString("base64");

	const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

	return NextResponse.redirect(slackAuthUrl);
}
