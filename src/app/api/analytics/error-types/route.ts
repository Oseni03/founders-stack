import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual error tracking integration
	const data = {
		data: [
			{ type: "TypeError", count: 342 },
			{ type: "NetworkError", count: 287 },
			{ type: "ValidationError", count: 156 },
			{ type: "AuthError", count: 98 },
			{ type: "DatabaseError", count: 67 },
		],
	};

	return NextResponse.json(data);
}
