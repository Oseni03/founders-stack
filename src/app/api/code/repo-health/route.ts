import { NextResponse } from "next/server";

export async function GET() {
	// Mock data - replace with actual GitHub/GitLab API integration
	const data = {
		score: 87,
		openIssues: 23,
		stalePRs: 4,
		codeReviewTime: "4.2 hours",
		testCoverage: 78,
	};

	return NextResponse.json(data);
}
