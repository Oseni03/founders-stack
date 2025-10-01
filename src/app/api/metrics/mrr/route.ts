import { NextResponse } from "next/server";

export async function GET() {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Mock data - replace with actual database query
	const data = {
		value: 12450,
		change: 2234,
		trend: "up" as const,
		label: "vs last month",
	};

	return NextResponse.json(data);
}
