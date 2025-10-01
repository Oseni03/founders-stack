import { NextResponse } from "next/server";

export async function GET() {
	await new Promise((resolve) => setTimeout(resolve, 500));

	const data = {
		value: 156,
		change: 23,
		trend: "up" as const,
		label: "vs last month",
	};

	return NextResponse.json(data);
}
