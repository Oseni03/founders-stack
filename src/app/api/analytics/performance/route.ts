import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual performance monitoring integration
	const data = {
		avgLoadTime: 1247,
		change: -3.2,
		p95LoadTime: 2834,
		apiLatency: 156,
	};

	return NextResponse.json(data);
}
