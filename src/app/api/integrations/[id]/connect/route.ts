import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id: providerId } = await params;
	try {
		// OAuth flow - redirect to provider's authorization URL
		let scopes;
		if (providerId === "slack") {
			scopes = [
				"calls:read",
				"channels:history",
				"channels:read",
				"conversations.connect:read",
				"groups:read",
				"reminders:read",
				"im:read",
				"mpim:read",
				"metadata.message:read",
				"pins:read",
				"team:read",
				"users.profile:read",
				"im:history",
				"mpim:history",
				"users:read",
			];
		}

		const data = await auth.api.oAuth2LinkAccount({
			body: {
				providerId: providerId,
				callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations`,
				scopes,
			},
			// This endpoint requires session cookies.
			headers: await headers(),
		});

		return NextResponse.json(data);
	} catch (error) {
		console.error(`Failed to connect ${providerId}`, error);
		return NextResponse.json(
			{ error: `Failed to fetch conect ${providerId}` },
			{ status: 500 }
		);
	}
}
