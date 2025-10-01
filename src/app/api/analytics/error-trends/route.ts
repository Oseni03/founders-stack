import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual error tracking integration
	const data = {
		data: [
			{ timestamp: "Mon", errorRate: 2.1, warningRate: 0.8 },
			{ timestamp: "Tue", errorRate: 2.5, warningRate: 1.2 },
			{ timestamp: "Wed", errorRate: 1.9, warningRate: 0.9 },
			{ timestamp: "Thu", errorRate: 3.2, warningRate: 1.5 },
			{ timestamp: "Fri", errorRate: 2.8, warningRate: 1.1 },
			{ timestamp: "Sat", errorRate: 1.6, warningRate: 0.7 },
			{ timestamp: "Sun", errorRate: 1.4, warningRate: 0.6 },
		],
	};

	return NextResponse.json(data);
}
