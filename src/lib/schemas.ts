import { z } from "zod";

export const TaskSchema = z.object({
	id: z.string(),
	status: z.enum(["open", "in_progress", "done"]),
	assignee: z.string().optional(),
	assigneeId: z.string().optional(),
	priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
	url: z.string().optional(),
	dueDate: z.string().datetime().optional(),
	labels: z.array(z.string()),
	attributes: z.record(z.string(), z.any()).optional(),
});

export const TransactionSchema = z.object({
	id: z.string(),
	amount: z.number(),
	type: z.enum(["subscription", "payment"]),
	customerId: z.string(),
	status: z.string(),
	date: z.string().datetime(),
	currency: z.string(),
	refundReason: z.string().optional(),
});

export const AnalyticsStateSchema = z.object({
	timeRange: z.string(),
	userMetrics: z
		.object({
			pageViews: z.number(),
			avgSessionDuration: z.number(),
			uniqueVisitors: z.number(),
		})
		.nullable(),
	errorMetrics: z
		.object({
			errorCount: z.number(),
			errorRate: z.number(),
		})
		.nullable(),
	geoMetrics: z.array(
		z.object({
			location: z.string(),
			pageViews: z.number(),
		})
	),
	pageViewTrends: z.array(
		z.object({
			timestamp: z.string(),
			value: z.number(),
		})
	),
	sessionDurationTrends: z.array(
		z.object({
			timestamp: z.string(),
			value: z.number(),
		})
	),
	errorTrends: z.array(
		z.object({
			timestamp: z.string(),
			value: z.number(),
		})
	),
});

export type AnalyticsState = z.infer<typeof AnalyticsStateSchema>;

export const MetricsResponseSchema = z.object({
	project: z.object({
		openTasks: z.number(),
		velocity: z.array(z.number()),
		overdueTasks: z.number(),
		topPriorities: z.array(
			z.object({
				id: z.string(),
				title: z.string(),
				priority: z.enum(["low", "medium", "high", "urgent"]),
				dueDate: z.string(),
			})
		),
		insight: z.string(),
	}),
	finance: z.object({
		mrr: z.number(),
		churn: z.number(),
		activeSubscriptions: z.number(),
		recentTransactions: z.array(
			z.object({
				id: z.string(),
				amount: z.number(),
				type: z.string(),
				date: z.string(),
			})
		),
		insight: z.string(),
	}),
	analytics: z.object({
		timeRange: z.string(),
		userMetrics: z.object({
			pageViews: z.number(),
			avgSessionDuration: z.number(),
			uniqueVisitors: z.number(),
		}),
		errorMetrics: z.object({
			errorCount: z.number(),
			errorRate: z.number(),
		}),
		geoMetrics: z.array(
			z.object({
				location: z.string(),
				pageViews: z.number(),
			})
		),
		pageViewTrends: z.array(
			z.object({
				timestamp: z.string(),
				value: z.number(),
			})
		),
		sessionDurationTrends: z.array(
			z.object({
				timestamp: z.string(),
				value: z.number(),
			})
		),
		errorTrends: z.array(
			z.object({
				timestamp: z.string(),
				value: z.number(),
			})
		),
		insight: z.string(),
	}),
	feedback: z.object({
		totalFeedback: z.number(),
		sentiment: z.number(),
		feedbackSentiment: z.array(
			z.object({
				name: z.string(),
				value: z.number(),
			})
		),
		recentFeedback: z.array(
			z.object({
				id: z.string(),
				text: z.string(),
				sentiment: z.enum(["positive", "neutral", "negative"]),
				date: z.string(),
			})
		),
		insight: z.string(),
	}),
	code: z.object({
		commits: z.number(),
		prs: z.number(),
		buildStatus: z.enum(["success", "failed", "pending"]),
		buildSuccessRate: z.number(),
		recentDeploys: z.array(
			z.object({
				id: z.string(),
				status: z.string(),
				timestamp: z.string(),
				environment: z.string(),
			})
		),
		insight: z.string(),
	}),
	communication: z.object({
		messageVolume: z.number(),
		unreadMentions: z.number(),
		sentiment: z.number(),
		recentThreads: z.array(
			z.object({
				id: z.string(),
				channel: z.string(),
				preview: z.string(),
				mentions: z.number(),
			})
		),
		insight: z.string(),
	}),
});

export type Metrics = z.infer<typeof MetricsResponseSchema>;
