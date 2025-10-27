import { NextRequest, NextResponse } from "next/server";
import {
	generateFeedbackInsight,
	updateFeedbackStatus,
} from "@/server/categories/feedbacks";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";

export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			const searchParams = request.nextUrl.searchParams;
			const range = searchParams.get("range") || "30d";
			const organizationId = user.organizationId;

			// Calculate date range
			const days = parseInt(range.replace("d", ""));
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - days);

			// Fetch all feedback (feeds) from all source tools
			const feeds = await prisma.feed.findMany({
				where: {
					organizationId,
					createdAt: {
						gte: startDate,
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				include: {
					project: {
						select: {
							name: true,
						},
					},
				},
			});

			// Calculate total feedback
			const totalFeedback = feeds.length;

			// Calculate average score
			const feedsWithScores = feeds.filter((f) => f.score !== null);
			const averageScore =
				feedsWithScores.length > 0
					? feedsWithScores.reduce(
							(sum, f) => sum + (f.score || 0),
							0
						) / feedsWithScores.length
					: 0;

			// Calculate total comments
			const totalComments = feeds.reduce(
				(sum, f) => sum + (f.commentsCount || 0),
				0
			);

			// Group feedback by status
			const statusMap = new Map<string, number>();
			feeds.forEach((feed) => {
				const status = feed.status || "Unknown";
				statusMap.set(status, (statusMap.get(status) || 0) + 1);
			});

			const feedbackByStatus = Array.from(statusMap.entries())
				.map(([name, value]) => ({ name, value }))
				.sort((a, b) => b.value - a.value);

			// Group feedback by category
			const categoryMap = new Map<string, number>();
			feeds.forEach((feed) => {
				const category = feed.category || "Uncategorized";
				categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
			});

			const feedbackByCategory = Array.from(categoryMap.entries())
				.map(([name, value]) => ({ name, value }))
				.sort((a, b) => b.value - a.value);

			// Format recent feedback
			const recentFeedback = feeds.map((feed) => ({
				id: feed.id,
				title: feed.title,
				description: feed.description || "",
				author: feed.author || "Anonymous",
				category: feed.category || "Uncategorized",
				status: feed.status,
				tags: feed.tags || [],
				score: feed.score || 0,
				commentsCount: feed.commentsCount || 0,
				date: feed.createdAt.toISOString(),
				url: feed.url || undefined,
				projectName: feed.project.name,
			}));

			// Generate insight
			const insight = generateFeedbackInsight({
				totalFeedback,
				averageScore,
				topStatus: feedbackByStatus[0]?.name,
				topCategory: feedbackByCategory[0]?.name,
				openCount: statusMap.get("Open") || 0,
			});

			return NextResponse.json({
				totalFeedback,
				averageScore: parseFloat(averageScore.toFixed(2)),
				totalComments,
				feedbackByStatus,
				feedbackByCategory,
				recentFeedback,
				insight,
			});
		} catch (error) {
			console.error("[Feedback API] Error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch feedback data" },
				{ status: 500 }
			);
		}
	});
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, data } = body;

		switch (action) {
			case "updateStatus":
				const feedback = await updateFeedbackStatus(data);
				return NextResponse.json({ success: true, feedback });
			default:
				return NextResponse.json(
					{ error: "Invalid action" },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error("[Feedback API] POST Error:", error);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 }
		);
	}
}
