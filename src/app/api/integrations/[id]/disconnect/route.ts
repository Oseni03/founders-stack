import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	{ params }: { params: { id: string } }
) {
	// Mock - remove integration connection
	console.log(`[v0] Disconnecting ${params.id}`);

	return NextResponse.json({ success: true });
}
