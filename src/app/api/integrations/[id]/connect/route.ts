import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	// OAuth flow - redirect to provider's authorization URL
	const integrationId = params.id;

	// Mock OAuth redirect
	const authUrl = `https://oauth.example.com/${integrationId}/authorize?client_id=xxx&redirect_uri=${encodeURIComponent(
		`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${integrationId}/callback`
	)}`;

	return NextResponse.redirect(authUrl);
}

export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	// API key connection
	const { apiKey } = await request.json();

	// Mock - validate and store API key
	console.log(`[v0] Connecting ${params.id} with API key`);

	return NextResponse.json({ success: true });
}
