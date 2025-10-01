import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual performance monitoring integration
	const data = {
		data: [
			{ timestamp: "Mon", avgLoadTime: 1234, p95LoadTime: 2876 },
			{ timestamp: "Tue", avgLoadTime: 1456, p95LoadTime: 3124 },
			{ timestamp: "Wed", avgLoadTime: 1187, p95LoadTime: 2654 },
			{ timestamp: "Thu", avgLoadTime: 1523, p95LoadTime: 3456 },
			{ timestamp: "Fri", avgLoadTime: 1398, p95LoadTime: 2987 },
			{ timestamp: "Sat", avgLoadTime: 1098, p95LoadTime: 2456 },
			{ timestamp: "Sun", avgLoadTime: 987, p95LoadTime: 2234 },
		],
	};

	return NextResponse.json(data);
}
