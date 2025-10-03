import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id: providerId } = await params;

	console.log(`[v0] Syncing ${providerId} integration...`);

	// Simulate sync delay
	await new Promise((resolve) => setTimeout(resolve, 2000));

	return NextResponse.json({ success: true });
}
