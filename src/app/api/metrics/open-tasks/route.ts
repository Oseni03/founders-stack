import { NextResponse } from "next/server";

export async function GET() {
	await new Promise((resolve) => setTimeout(resolve, 500));

	const data = {
		value: 24,
		change: 3,
		trend: "up" as const,
		label: "across all projects",
	};

	return NextResponse.json(data);
}
