import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual analytics integration
	const data = {
		data: [
			{ date: "Mon", activeUsers: 11234, newUsers: 234 },
			{ date: "Tue", activeUsers: 12456, newUsers: 312 },
			{ date: "Wed", activeUsers: 11987, newUsers: 287 },
			{ date: "Thu", activeUsers: 13245, newUsers: 398 },
			{ date: "Fri", activeUsers: 12876, newUsers: 345 },
			{ date: "Sat", activeUsers: 10234, newUsers: 198 },
			{ date: "Sun", activeUsers: 9876, newUsers: 176 },
		],
	};

	return NextResponse.json(data);
}
