import { NextResponse } from "next/server";

export async function GET() {
	// Mock data - replace with actual GitHub/GitLab API integration
	const data = {
		contributors: [
			{
				name: "Sarah Chen",
				avatar: "/developer-working.png",
				commits: 127,
				additions: 8432,
				deletions: 2341,
			},
			{
				name: "Alex Kumar",
				avatar: "/programmer.png",
				commits: 98,
				additions: 6234,
				deletions: 1876,
			},
			{
				name: "Jordan Lee",
				avatar: "/coder.png",
				commits: 76,
				additions: 4521,
				deletions: 1432,
			},
			{
				name: "Morgan Taylor",
				avatar: "/diverse-engineers-meeting.png",
				commits: 54,
				additions: 3210,
				deletions: 987,
			},
			{
				name: "Casey Brown",
				avatar: "/developer2.jpg",
				commits: 43,
				additions: 2876,
				deletions: 765,
			},
		],
	};

	return NextResponse.json(data);
}
