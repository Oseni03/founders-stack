import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";

const querySchema = z.object({
	range: z.enum(["7d", "30d", "90d"]).default("30d"),
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
// 	const key = `rate:project:${userId}`;
// 	const count = await redis.incr(key);
// 	if (count === 1) await redis.expire(key, 60);
// 	return count <= 15;
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
		});
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid range" },
				{ status: 400 }
			);
		}

		const { range } = parsed.data;
		const orgId = user.organizationId;

		try {
			const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
			const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
			const weekStarts: Date[] = [];
			for (let i = 0; i < 12; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (i + 1) * 7);
				date.setHours(0, 0, 0, 0);
				weekStarts.push(date);
			}

			// Open Tasks (not done)
			const openTasks = await prisma.task.count({
				where: {
					organizationId: orgId,
					status: { not: "done" },
				},
			});

			// Overdue Tasks
			const overdueTasks = await prisma.task.count({
				where: {
					organizationId: orgId,
					status: { not: "done" },
					dueDate: { lt: new Date(), not: null },
				},
			});

			// Velocity: Tasks completed per week (last 12 weeks)
			const velocityPromises = weekStarts.map(async (weekStart) => {
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekEnd.getDate() + 7);
				return prisma.task.count({
					where: {
						organizationId: orgId,
						status: "done",
						updatedAt: { gte: weekStart, lt: weekEnd },
					},
				});
			});

			const velocity = await Promise.all(velocityPromises);

			// Top Priorities: High/Urgent, not done, soonest due
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

			const insight =
				openTasks > 50
					? "High task volume. Prioritize overdue items to improve velocity."
					: "Healthy task flow. Maintain current pace.";

			return NextResponse.json({
				openTasks,
				velocity,
				overdueTasks,
				topPriorities,
				insight,
			});
		} catch (error) {
			console.error("Project Health API error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	});
}
