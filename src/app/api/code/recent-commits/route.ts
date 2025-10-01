import { NextResponse } from "next/server";

export async function GET() {
	// Mock data - replace with actual GitHub/GitLab API integration
	const data = {
		commits: [
			{
				id: "abc123",
				message: "feat: Add user authentication with OAuth2",
				author: "Sarah Chen",
				avatar: "/developer-working.png",
				timestamp: "2 hours ago",
				repo: "founders-stack",
				branch: "main",
				url: "https://github.com/example/founders-stack/commit/abc123",
			},
			{
				id: "def456",
				message: "fix: Resolve memory leak in dashboard component",
				author: "Alex Kumar",
				avatar: "/programmer.png",
				timestamp: "4 hours ago",
				repo: "founders-stack",
				branch: "bugfix/memory-leak",
				url: "https://github.com/example/founders-stack/commit/def456",
			},
			{
				id: "ghi789",
				message: "docs: Update API documentation for v2 endpoints",
				author: "Jordan Lee",
				avatar: "/coder.png",
				timestamp: "6 hours ago",
				repo: "api-docs",
				branch: "main",
				url: "https://github.com/example/api-docs/commit/ghi789",
			},
			{
				id: "jkl012",
				message: "refactor: Simplify integration adapter pattern",
				author: "Morgan Taylor",
				avatar: "/diverse-engineers-meeting.png",
				timestamp: "8 hours ago",
				repo: "founders-stack",
				branch: "refactor/adapters",
				url: "https://github.com/example/founders-stack/commit/jkl012",
			},
			{
				id: "mno345",
				message: "test: Add unit tests for payment processing",
				author: "Casey Brown",
				avatar: "/developer2.jpg",
				timestamp: "10 hours ago",
				repo: "payment-service",
				branch: "test/payments",
				url: "https://github.com/example/payment-service/commit/mno345",
			},
		],
	};

	return NextResponse.json(data);
}
