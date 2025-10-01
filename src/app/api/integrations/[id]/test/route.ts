import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	// Mock - test connection
	console.log(`[v0] Testing connection for ${params.id}`);

	// Simulate test delay
	await new Promise((resolve) => setTimeout(resolve, 1500));

	return NextResponse.json({ success: true });
}
