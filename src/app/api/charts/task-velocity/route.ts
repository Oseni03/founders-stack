import { NextResponse } from "next/server";

export async function GET() {
	await new Promise((resolve) => setTimeout(resolve, 800));

	// Mock task velocity data
	const data = {
		data: [
			{ week: "Week 1", completed: 12, planned: 15 },
			{ week: "Week 2", completed: 18, planned: 20 },
			{ week: "Week 3", completed: 15, planned: 18 },
			{ week: "Week 4", completed: 22, planned: 22 },
			{ week: "Week 5", completed: 19, planned: 20 },
			{ week: "Week 6", completed: 24, planned: 25 },
		],
	};

	return NextResponse.json(data);
}
