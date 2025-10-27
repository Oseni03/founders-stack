"use server";

import { prisma } from "@/lib/prisma";

export async function updateFeedbackStatus(data: {
	feedbackId: string;
	status: string;
}) {
	const { feedbackId, status } = data;

	const feedback = await prisma.feed.update({
		where: { id: feedbackId },
		data: {
			status,
			updatedAt: new Date(),
		},
	});

	return feedback;
}

export async function generateFeedbackInsight(metrics: {
	totalFeedback: number;
	averageScore: number;
	topStatus?: string;
	topCategory?: string;
	openCount: number;
}): Promise<string> {
	const insights = [];

	if (metrics.totalFeedback > 100) {
		insights.push(
			`Strong engagement with ${metrics.totalFeedback} feedback items`
		);
	} else if (metrics.totalFeedback < 10) {
		insights.push("Consider encouraging more user feedback");
	}

	if (metrics.averageScore >= 4) {
		insights.push(
			`Excellent satisfaction with ${metrics.averageScore.toFixed(1)}/5 rating`
		);
	} else if (metrics.averageScore < 3) {
		insights.push(
			`Low satisfaction score of ${metrics.averageScore.toFixed(1)}/5 needs attention`
		);
	}

	if (metrics.openCount > 20) {
		insights.push(`${metrics.openCount} open items require review`);
	}

	if (metrics.topCategory) {
		insights.push(`Most feedback is about ${metrics.topCategory}`);
	}

	return insights.length > 0
		? insights.join(". ") + "."
		: "Feedback metrics are within normal ranges.";
}
