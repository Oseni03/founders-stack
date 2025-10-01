import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	// Mock - trigger manual sync
	console.log(`[v0] Syncing ${params.id}`);

	// Simulate sync delay
	await new Promise((resolve) => setTimeout(resolve, 2000));

	return NextResponse.json({ success: true });
}
