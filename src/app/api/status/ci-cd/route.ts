import { NextResponse } from "next/server";

export async function GET() {
	await new Promise((resolve) => setTimeout(resolve, 400));

	const data = {
		status: "good" as const,
		value: 94,
		label: "Build Success Rate",
		message: "3 of last 50 builds failed",
		indicators: [
			{
				id: "build",
				label: "Build Pipeline",
				status: "healthy" as const,
				value: "2.3min",
			},
			{
				id: "tests",
				label: "Test Suite",
				status: "healthy" as const,
				value: "85% coverage",
			},
			{
				id: "deploy",
				label: "Deployment",
				status: "healthy" as const,
				value: "12 today",
			},
		],
	};

	return NextResponse.json(data);
}
