import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual analytics integration
	const data = {
		data: [
			{ date: "Mon", sessionDuration: 8.5 },
			{ date: "Tue", sessionDuration: 9.2 },
			{ date: "Wed", sessionDuration: 7.8 },
			{ date: "Thu", sessionDuration: 10.1 },
			{ date: "Fri", sessionDuration: 9.6 },
			{ date: "Sat", sessionDuration: 6.4 },
			{ date: "Sun", sessionDuration: 5.9 },
		],
	};

	return NextResponse.json(data);
}
