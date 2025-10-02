import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const query = searchParams.get("q");

		if (!query || query.length < 2) {
			return NextResponse.json({ results: {} });
		}

		// Get current user
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// // Search tasks
		// const tasks = await prisma.cdm_tasks.findMany({
		// 	where: {
		// 		user_id: userId,
		// 		OR: [
		// 			{ title: { contains: query, mode: "insensitive" } },
		// 			{ description: { contains: query, mode: "insensitive" } },
		// 		],
		// 	},
		// 	select: {
		// 		id: true,
		// 		title: true,
		// 		description: true,
		// 		status: true,
		// 		priority: true,
		// 	},
		// 	take: 5,
		// });

		// // Search transactions
		// const transactions = await prisma.cdm_transactions.findMany({
		// 	where: {
		// 		user_id: userId,
		// 		OR: [
		// 			{ description: { contains: query, mode: "insensitive" } },
		// 			{ category: { contains: query, mode: "insensitive" } },
		// 		],
		// 	},
		// 	select: {
		// 		id: true,
		// 		description: true,
		// 		amount: true,
		// 		category: true,
		// 		date: true,
		// 	},
		// 	take: 5,
		// });

		// // Search commits
		// const commits = await prisma.cdm_commits.findMany({
		// 	where: {
		// 		user_id: userId,
		// 		OR: [
		// 			{ message: { contains: query, mode: "insensitive" } },
		// 			{ author: { contains: query, mode: "insensitive" } },
		// 			{ repository: { contains: query, mode: "insensitive" } },
		// 		],
		// 	},
		// 	select: {
		// 		id: true,
		// 		message: true,
		// 		author: true,
		// 		repository: true,
		// 		sha: true,
		// 	},
		// 	take: 5,
		// });

		// // Search messages
		// const messages = await prisma.cdm_messages.findMany({
		// 	where: {
		// 		user_id: userId,
		// 		OR: [
		// 			{ content: { contains: query, mode: "insensitive" } },
		// 			{ sender: { contains: query, mode: "insensitive" } },
		// 			{ channel: { contains: query, mode: "insensitive" } },
		// 		],
		// 	},
		// 	select: {
		// 		id: true,
		// 		content: true,
		// 		sender: true,
		// 		channel: true,
		// 		platform: true,
		// 	},
		// 	take: 5,
		// });

		// // Search support tickets
		// const tickets = await prisma.cdm_tickets.findMany({
		// 	where: {
		// 		user_id: userId,
		// 		OR: [
		// 			{ title: { contains: query, mode: "insensitive" } },
		// 			{ description: { contains: query, mode: "insensitive" } },
		// 		],
		// 	},
		// 	select: {
		// 		id: true,
		// 		title: true,
		// 		description: true,
		// 		status: true,
		// 		priority: true,
		// 	},
		// 	take: 5,
		// });

		// Format results
		const results = {
			tasks: [
				{
					id: "task-1",
					type: "task" as const,
					title: "Complete project documentation",
					description: "in_progress • high",
					url: `/dashboard/tasks?id=task-1`,
					metadata: {
						id: "task-1",
						title: "Complete project documentation",
						description:
							"Write comprehensive docs for the new feature",
						status: "in_progress",
						priority: "high",
					},
				},
				{
					id: "task-2",
					type: "task" as const,
					title: "Review pull requests",
					description: "todo • medium",
					url: `/dashboard/tasks?id=task-2`,
					metadata: {
						id: "task-2",
						title: "Review pull requests",
						description: "Review and approve pending PRs",
						status: "todo",
						priority: "medium",
					},
				},
			],
			transactions: [
				{
					id: "txn-1",
					type: "transaction" as const,
					title: "Coffee shop purchase",
					description: "$4.50 • Food & Dining • 10/1/2025",
					url: `/dashboard/analytics?type=transactions&id=txn-1`,
					metadata: {
						id: "txn-1",
						description: "Coffee shop purchase",
						amount: 4.5,
						category: "Food & Dining",
						date: "2025-10-01",
					},
				},
				{
					id: "txn-2",
					type: "transaction" as const,
					title: "Monthly subscription",
					description: "$9.99 • Subscriptions • 10/1/2025",
					url: `/dashboard/analytics?type=transactions&id=txn-2`,
					metadata: {
						id: "txn-2",
						description: "Monthly subscription",
						amount: 9.99,
						category: "Subscriptions",
						date: "2025-10-01",
					},
				},
			],
			commits: [
				{
					id: "commit-1",
					type: "commit" as const,
					title: "Add search functionality",
					description: "John Doe • my-repo • a1b2c3d",
					url: `/dashboard/code?commit=a1b2c3d4e5f6g7h8i9j0`,
					metadata: {
						id: "commit-1",
						message: "Add search functionality",
						author: "John Doe",
						repository: "my-repo",
						sha: "a1b2c3d4e5f6g7h8i9j0",
					},
				},
				{
					id: "commit-2",
					type: "commit" as const,
					title: "Fix bug in authentication",
					description: "Jane Smith • auth-service • b2c3d4e",
					url: `/dashboard/code?commit=b2c3d4e5f6g7h8i9j0k1`,
					metadata: {
						id: "commit-2",
						message: "Fix bug in authentication",
						author: "Jane Smith",
						repository: "auth-service",
						sha: "b2c3d4e5f6g7h8i9j0k1",
					},
				},
			],
			messages: [
				{
					id: "msg-1",
					type: "message" as const,
					title: "Hey, can you review my PR?",
					description: "Alice Johnson • Slack • engineering",
					url: `/dashboard/integrations?platform=Slack&message=msg-1`,
					metadata: {
						id: "msg-1",
						content: "Hey, can you review my PR?",
						sender: "Alice Johnson",
						channel: "engineering",
						platform: "Slack",
					},
				},
				{
					id: "msg-2",
					type: "message" as const,
					title: "Meeting scheduled for tomorrow at 2pm",
					description: "Bob Williams • Teams • general",
					url: `/dashboard/integrations?platform=Teams&message=msg-2`,
					metadata: {
						id: "msg-2",
						content: "Meeting scheduled for tomorrow at 2pm",
						sender: "Bob Williams",
						channel: "general",
						platform: "Teams",
					},
				},
			],
			tickets: [
				{
					id: "ticket-1",
					type: "ticket" as const,
					title: "Login page not loading",
					description: "open • high",
					url: `/dashboard/integrations?type=support&ticket=ticket-1`,
					metadata: {
						id: "ticket-1",
						title: "Login page not loading",
						description:
							"Users are unable to access the login page",
						status: "open",
						priority: "high",
					},
				},
				{
					id: "ticket-2",
					type: "ticket" as const,
					title: "Feature request: Dark mode",
					description: "open • low",
					url: `/dashboard/integrations?type=support&ticket=ticket-2`,
					metadata: {
						id: "ticket-2",
						title: "Feature request: Dark mode",
						description: "Add dark mode support to the application",
						status: "open",
						priority: "low",
					},
				},
			],
			analytics: [],
		};

		return NextResponse.json({ results });
	} catch (error) {
		console.error("[v0] Search error:", error);
		return NextResponse.json({ error: "Search failed" }, { status: 500 });
	}
}
