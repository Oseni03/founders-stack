import { NextResponse } from "next/server";
import { GitCommit } from "lucide-react";

export async function GET() {
	await new Promise((resolve) => setTimeout(resolve, 600));

	const data = {
		items: [
			{
				id: "1",
				title: "feat: Add user authentication",
				description: "Implemented OAuth2 flow with GitHub",
				timestamp: "5 minutes ago",
				status: "success" as const,
				icon: GitCommit,
			},
			{
				id: "2",
				title: "fix: Resolve payment processing bug",
				description: "Fixed Stripe webhook handling",
				timestamp: "23 minutes ago",
				status: "success" as const,
				icon: GitCommit,
			},
			{
				id: "3",
				title: "refactor: Update dashboard components",
				description: "Improved performance and accessibility",
				timestamp: "1 hour ago",
				status: "success" as const,
				icon: GitCommit,
			},
			{
				id: "4",
				title: "docs: Update API documentation",
				description: "Added examples for new endpoints",
				timestamp: "2 hours ago",
				status: "info" as const,
				icon: GitCommit,
			},
			{
				id: "5",
				title: "test: Add integration tests",
				description: "Increased coverage to 85%",
				timestamp: "3 hours ago",
				status: "success" as const,
				icon: GitCommit,
			},
		],
	};

	return NextResponse.json(data);
}
