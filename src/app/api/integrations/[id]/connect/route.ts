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

		const data = await auth.api.oAuth2LinkAccount({
			body: {
				providerId,
				callbackURL: `/api/auth/oauth2/callback/${providerId}`,
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

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id: providerId } = await params;
	try {
		// API key connection
		const { apiKey } = await request.json();

		// Mock - validate and store API key
		console.log(`Connecting ${providerId} with API key`);

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: `Failed to fetch conect ${providerId}` },
			{ status: 500 }
		);
	}
}
