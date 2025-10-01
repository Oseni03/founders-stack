import { NextResponse } from "next/server";

export async function GET() {
	await new Promise((resolve) => setTimeout(resolve, 800));

	// Mock revenue data for the last 6 months
	const data = {
		data: [
			{ month: "Jul", revenue: 8500, expenses: 3200 },
			{ month: "Aug", revenue: 9200, expenses: 3400 },
			{ month: "Sep", revenue: 10100, expenses: 3600 },
			{ month: "Oct", revenue: 10800, expenses: 3500 },
			{ month: "Nov", revenue: 11500, expenses: 3700 },
			{ month: "Dec", revenue: 12450, expenses: 3800 },
		],
	};

	return NextResponse.json(data);
}
