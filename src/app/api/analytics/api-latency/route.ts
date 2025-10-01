import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual API monitoring integration
	const data = {
		data: [
			{ endpoint: "/api/users", latency: 145 },
			{ endpoint: "/api/tasks", latency: 234 },
			{ endpoint: "/api/analytics", latency: 312 },
			{ endpoint: "/api/integrations", latency: 189 },
			{ endpoint: "/api/code", latency: 267 },
		],
	};

	return NextResponse.json(data);
}
