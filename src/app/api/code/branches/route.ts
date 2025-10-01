import { NextResponse } from "next/server";

export async function GET() {
	// Mock data - replace with actual GitHub/GitLab API integration
	const data = {
		branches: [
			{
				name: "main",
				lastCommit: "2 hours ago",
				commitsAhead: 0,
				status: "active" as const,
			},
			{
				name: "feature/analytics-dashboard",
				lastCommit: "5 hours ago",
				commitsAhead: 12,
				status: "active" as const,
			},
			{
				name: "bugfix/memory-leak",
				lastCommit: "4 hours ago",
				commitsAhead: 3,
				status: "active" as const,
			},
			{
				name: "refactor/adapters",
				lastCommit: "8 hours ago",
				commitsAhead: 7,
				status: "active" as const,
			},
			{
				name: "feature/old-feature",
				lastCommit: "2 weeks ago",
				commitsAhead: 45,
				status: "stale" as const,
			},
		],
	};

	return NextResponse.json(data);
}
