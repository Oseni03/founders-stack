import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual Sentry/error tracking integration
	const data = {
		currentRate: 2.3,
		change: -0.5,
		totalErrors: 1247,
		affectedUsers: 89,
	};

	return NextResponse.json(data);
}
