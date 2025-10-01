import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual Google Analytics/Amplitude integration
	const data = {
		activeUsers: 12453,
		change: 8.2,
		newUsers: 1876,
		retention: 68,
	};

	return NextResponse.json(data);
}
