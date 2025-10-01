import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual correlation analysis
	const data = {
		data: [
			{ date: "2024-01-01", deploys: 2, errors: 45, users: 1200 },
			{ date: "2024-01-02", deploys: 0, errors: 23, users: 1150 },
			{ date: "2024-01-03", deploys: 3, errors: 67, users: 1300 },
			{ date: "2024-01-04", deploys: 1, errors: 34, users: 1250 },
			{ date: "2024-01-05", deploys: 0, errors: 19, users: 1180 },
			{ date: "2024-01-06", deploys: 2, errors: 52, users: 1220 },
			{ date: "2024-01-07", deploys: 1, errors: 28, users: 1190 },
		],
	};

	return NextResponse.json(data);
}
