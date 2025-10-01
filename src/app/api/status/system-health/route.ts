import { NextResponse } from "next/server";

export async function GET() {
	await new Promise((resolve) => setTimeout(resolve, 400));

	const data = {
		status: "excellent" as const,
		value: 99.7,
		label: "System Health",
		message: "All systems operational",
		indicators: [
			{
				id: "api",
				label: "API Server",
				status: "healthy" as const,
				value: "245ms",
				lastChecked: "30s ago",
			},
			{
				id: "database",
				label: "Database",
				status: "healthy" as const,
				value: "12ms",
				lastChecked: "30s ago",
			},
			{
				id: "cache",
				label: "Cache Layer",
				status: "healthy" as const,
				value: "3ms",
				lastChecked: "30s ago",
			},
			{
				id: "cdn",
				label: "CDN",
				status: "healthy" as const,
				value: "99.9%",
				lastChecked: "1m ago",
			},
		],
	};

	return NextResponse.json(data);
}
