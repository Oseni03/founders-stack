import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "7d";

	// Mock data - replace with actual alert system integration
	const data = {
		alerts: [
			{
				id: "1",
				type: "error" as const,
				message: "Error rate exceeded 5% threshold",
				timestamp: "2 hours ago",
				severity: "critical" as const,
			},
			{
				id: "2",
				type: "performance" as const,
				message: "API latency increased by 40%",
				timestamp: "5 hours ago",
				severity: "warning" as const,
			},
			{
				id: "3",
				type: "user" as const,
				message: "User retention dropped below 65%",
				timestamp: "1 day ago",
				severity: "warning" as const,
			},
			{
				id: "4",
				type: "error" as const,
				message: "New error pattern detected in payment flow",
				timestamp: "1 day ago",
				severity: "critical" as const,
			},
		],
	};

	return NextResponse.json(data);
}
