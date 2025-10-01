import { NextResponse } from "next/server";

export async function GET() {
	// Mock data - replace with actual GitHub/GitLab API integration
	const data = {
		data: [
			{ date: "Mon", commits: 23 },
			{ date: "Tue", commits: 31 },
			{ date: "Wed", commits: 28 },
			{ date: "Thu", commits: 42 },
			{ date: "Fri", commits: 38 },
			{ date: "Sat", commits: 15 },
			{ date: "Sun", commits: 12 },
		],
	};

	return NextResponse.json(data);
}
