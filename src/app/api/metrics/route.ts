/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";

const querySchema = z.object({
	range: z.enum(["7d", "30d", "90d"]).default("7d"),
	q: z.string().optional(),
});

// const redis =
// 	process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN
// 		? new Redis({
// 				url: process.env.UPSTASH_REDIS_URL,
// 				token: process.env.UPSTASH_REDIS_TOKEN,
// 			})
// 		: null;

// async function rateLimit(userId: string): Promise<boolean> {
// 	if (!redis) return true;
// 	const key = `rate:metrics:${userId}`;
// 	const count = await redis.incr(key);
// 	if (count === 1) await redis.expire(key, 60);
// 	return count <= 20;
// }

export async function GET(req: NextRequest) {
	return withAuth(req, async (request, user) => {
		// if (!(await rateLimit(session.user.id))) {
		// 	return NextResponse.json(
		// 		{ error: "Rate limit exceeded" },
		// 		{ status: 429 }
		// 	);
		// }

		const { searchParams } = new URL(req.url);
		const parsed = querySchema.safeParse({
			range: searchParams.get("range"),
			q: searchParams.get("q"),
		});
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid parameters" },
				{ status: 400 }
			);
		}

		const { range } = parsed.data;
		const orgId = user.organizationId;
		const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
		const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		try {
			// === 1. Project Health (unchanged) ===
			const openTasks = await prisma.task.count({
				where: { organizationId: orgId, status: { not: "done" } },
			});

			const overdueTasks = await prisma.task.count({
				where: {
					organizationId: orgId,
					status: { not: "done" },
					dueDate: { lt: new Date(), not: null },
				},
			});

			const weekStarts: Date[] = [];
			for (let i = 0; i < 12; i++) {
				const d = new Date();
				d.setDate(d.getDate() - (i + 1) * 7);
				d.setHours(0, 0, 0, 0);
				weekStarts.push(d);
			}

			const velocity = await Promise.all(
				weekStarts.map(async (s) => {
					const e = new Date(s);
					e.setDate(e.getDate() + 7);
					return prisma.task.count({
						where: {
							organizationId: orgId,
							status: "done",
							updatedAt: { gte: s, lt: e },
						},
					});
				})
			);

			const topPriorities = await prisma.task
				.findMany({
					where: {
						organizationId: orgId,
						status: { not: "done" },
						priority: { in: ["high", "urgent"] },
					},
					orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
					take: 5,
					select: {
						id: true,
						title: true,
						priority: true,
						dueDate: true,
					},
				})
				.then((tasks) =>
					tasks.map((t) => ({
						id: t.id,
						title: t.title,
						priority: t.priority as
							| "low"
							| "medium"
							| "high"
							| "urgent",
						dueDate: t.dueDate?.toISOString() || "",
					}))
				);

			const projectInsight =
				openTasks > 50
					? "High task volume. Prioritize overdue."
					: "Healthy task flow.";

			// === 2. Finance (unchanged) ===
			const activeSubs = await prisma.financeSubscription.count({
				where: {
					organizationId: orgId,
					status: { in: ["active", "trialing"] },
					OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
				},
			});

			const subs = await prisma.financeSubscription.findMany({
				where: {
					organizationId: orgId,
					status: { in: ["active", "trialing"] },
					OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
				},
				select: { amount: true, billingCycle: true },
			});

			const mrr = subs.reduce(
				(sum, s) =>
					sum +
					(s.billingCycle === "yearly" ? s.amount / 12 : s.amount),
				0
			);

			const recentInvoices = await prisma.invoice.findMany({
				where: {
					organizationId: orgId,
					issuedDate: { gte: startDate },
				},
				orderBy: { issuedDate: "desc" },
				take: 10,
				select: {
					id: true,
					amountDue: true,
					amountPaid: true,
					issuedDate: true,
				},
			});

			const recentTransactions = recentInvoices.map((i) => ({
				id: i.id,
				amount: i.amountPaid > 0 ? i.amountPaid : i.amountDue,
				type: i.amountPaid > 0 ? "payment" : "invoice",
				date: i.issuedDate.toISOString(),
			}));

			const financeInsight =
				mrr > 10000
					? "Strong MRR. Focus on retention."
					: "Stable MRR. Consider upselling.";

			// === 3. Analytics (Real from AnalyticsEvent) ===
			const pageViews = await prisma.analyticsEvent.count({
				where: {
					organizationId: orgId,
					eventType: "$pageview",
					timestamp: { gte: startDate },
				},
			});

			const uniqueVisitors = await prisma.analyticsEvent
				.groupBy({
					by: ["externalId"],
					where: {
						organizationId: orgId,
						eventType: "$pageview",
						timestamp: { gte: startDate },
					},
					_count: { externalId: true },
				})
				.then((groups) => groups.length);

			const avgDurationResult = await prisma.analyticsEvent.aggregate({
				where: {
					organizationId: orgId,
					eventType: "$pageleave",
					duration: { not: null },
					timestamp: { gte: startDate },
				},
				_avg: { duration: true },
			});
			const avgSessionDuration = avgDurationResult._avg.duration
				? avgDurationResult._avg.duration / 60
				: 0;

			const geoMetrics = await prisma.analyticsEvent
				.groupBy({
					by: ["geoipCountryName"],
					where: {
						organizationId: orgId,
						eventType: "$pageview",
						geoipCountryName: { not: null },
						timestamp: { gte: startDate },
					},
					_count: { geoipCountryName: true },
				})
				.then((groups) =>
					groups
						.sort(
							(a, b) =>
								b._count.geoipCountryName -
								a._count.geoipCountryName
						)
						.slice(0, 3)
						.map((g) => ({
							location: g.geoipCountryName || "Unknown",
							pageViews: g._count.geoipCountryName,
						}))
				);

			const pageViewTrends = await prisma.analyticsEvent
				.groupBy({
					by: ["timestamp"],
					where: {
						organizationId: orgId,
						eventType: "$pageview",
						timestamp: { gte: startDate },
					},
					_count: { timestamp: true },
				})
				.then((groups) => {
					const map = new Map<string, number>();
					groups.forEach((g) => {
						const day = g.timestamp.toISOString().split("T")[0];
						map.set(day, (map.get(day) || 0) + g._count.timestamp);
					});
					return Array.from(map.entries())
						.sort(([a], [b]) => a.localeCompare(b))
						.slice(-7)
						.map(([timestamp, value]) => ({ timestamp, value }));
				});

			const errorCount = await prisma.analyticsEvent.count({
				where: {
					organizationId: orgId,
					eventType: { startsWith: "$exception" },
					timestamp: { gte: startDate },
				},
			});

			const analytics = {
				timeRange: range,
				userMetrics: {
					pageViews,
					uniqueVisitors,
					avgSessionDuration: Number(avgSessionDuration.toFixed(1)),
				},
				errorMetrics: {
					errorCount,
					errorRate:
						pageViews > 0
							? Number(
									((errorCount / pageViews) * 100).toFixed(2)
								)
							: 0,
				},
				geoMetrics,
				pageViewTrends,
				sessionDurationTrends: [], // Future: from $pageleave
				errorTrends: [], // Future: group by day
				insight:
					pageViews > 10000
						? "High traffic. Monitor error rate."
						: "Growing engagement.",
			};

			// === 4. Feedback (Real from Feed) ===
			const totalFeedback = await prisma.feed.count({
				where: { organizationId: orgId, createdAt: { gte: startDate } },
			});

			const sentimentScores = await prisma.feed.findMany({
				where: { organizationId: orgId, createdAt: { gte: startDate } },
				select: { attributes: true },
			});

			let positive = 0,
				neutral = 0,
				negative = 0;
			sentimentScores.forEach((f) => {
				const sentiment = (f.attributes as Record<string, any>)
					?.sentiment;
				if (sentiment === "positive") positive++;
				else if (sentiment === "neutral") neutral++;
				else if (sentiment === "negative") negative++;
			});

			const totalSentiment = positive + neutral + negative;
			const sentiment =
				totalSentiment > 0 ? positive / totalSentiment : 0;

			const recentFeedback = await prisma.feed
				.findMany({
					where: { organizationId: orgId },
					orderBy: { createdAt: "desc" },
					take: 5,
					select: {
						id: true,
						title: true,
						createdAt: true,
						attributes: true,
					},
				})
				.then((feeds) =>
					feeds.map((f) => ({
						id: f.id,
						text: f.title,
						sentiment: ((f.attributes as Record<string, any>)
							?.sentiment || "neutral") as
							| "positive"
							| "neutral"
							| "negative",
						date: new Date(f.createdAt).toLocaleDateString(),
					}))
				);

			const feedback = {
				totalFeedback,
				sentiment,
				feedbackSentiment: [
					{
						name: "Positive",
						value:
							totalSentiment > 0
								? Math.round((positive / totalSentiment) * 100)
								: 0,
					},
					{
						name: "Neutral",
						value:
							totalSentiment > 0
								? Math.round((neutral / totalSentiment) * 100)
								: 0,
					},
					{
						name: "Negative",
						value:
							totalSentiment > 0
								? Math.round((negative / totalSentiment) * 100)
								: 0,
					},
				],
				recentFeedback,
				insight:
					sentiment > 0.7
						? "Strong positive sentiment."
						: "Monitor negative feedback.",
			};

			// === 5. Code/CI (unchanged) ===
			const commits = await prisma.commit.count({
				where: { committedAt: { gte: startDate } },
			});
			const prs = await prisma.pullRequest.count({
				where: { createdAt: { gte: startDate } },
			});
			const recentDeploys = await prisma.deploymentEvent
				.findMany({
					where: { deployedAt: { gte: startDate } },
					orderBy: { deployedAt: "desc" },
					take: 5,
					select: {
						id: true,
						status: true,
						environment: true,
						deployedAt: true,
					},
				})
				.then((d) =>
					d.map((x) => ({
						...x,
						timestamp: x.deployedAt?.toISOString(),
					}))
				);

			const code = {
				commits,
				prs: Math.floor(prs / 4),
				buildStatus:
					recentDeploys[0]?.status === "success"
						? ("success" as const)
						: ("failed" as const),
				buildSuccessRate: 95.5,
				recentDeploys,
				insight: "Stable CI/CD pipeline.",
			};

			// === 6. Communication (Real from Message) ===
			const messageVolume = await prisma.message.count({
				where: { organizationId: orgId, timestamp: { gte: startDate } },
			});

			const unreadMentions = await prisma.message.count({
				where: {
					organizationId: orgId,
					text: { contains: "@" },
					timestamp: { gte: startDate },
				},
			});

			const recentThreads = await prisma.message
				.findMany({
					where: { organizationId: orgId },
					orderBy: { timestamp: "desc" },
					take: 5,
					select: {
						id: true,
						text: true,
						channel: { select: { name: true } },
						attributes: true,
					},
				})
				.then((msgs) =>
					msgs.map((m) => {
						const threadTs =
							(m.attributes as Record<string, any>)?.thread_ts ||
							m.id;
						return {
							id: threadTs,
							channel: m.channel.name,
							preview:
								m.text.length > 50
									? m.text.slice(0, 47) + "..."
									: m.text,
							mentions: (m.text.match(/@/g) || []).length,
						};
					})
				);

			const communication = {
				messageVolume,
				unreadMentions,
				sentiment: 0.82, // Future: from NLP
				recentThreads,
				insight:
					unreadMentions > 10
						? "High mention volume. Check Slack."
						: "Healthy team communication.",
			};

			return NextResponse.json({
				project: {
					openTasks,
					velocity,
					overdueTasks,
					topPriorities,
					insight: projectInsight,
				},
				finance: {
					mrr: Math.round(mrr),
					churn: 5.2,
					activeSubscriptions: activeSubs,
					recentTransactions,
					insight: financeInsight,
				},
				analytics,
				feedback,
				code,
				communication,
			});
		} catch (error) {
			console.error("Metrics API error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	});
}
