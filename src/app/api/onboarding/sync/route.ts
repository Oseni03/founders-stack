import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { integrationIds } = body;

		// In production, this would trigger actual sync jobs for each integration
		// For now, we'll simulate the sync process
		console.log(
			"[v0] Starting initial sync for integrations:",
			integrationIds
		);

		// Simulate sync delay
		await new Promise((resolve) => setTimeout(resolve, 2000));

		return NextResponse.json({
			success: true,
			message: `Started sync for ${integrationIds.length} integrations`,
		});
	} catch (error) {
		console.error("[v0] Failed to start sync:", error);
		return NextResponse.json(
			{ error: "Failed to start sync" },
			{ status: 500 }
		);
	}
}
