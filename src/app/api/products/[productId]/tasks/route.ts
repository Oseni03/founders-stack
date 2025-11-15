/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";

const taskQuerySchema = z.object({
	status: z.string().optional(),
	priority: z.string().optional(),
	assigneeId: z.string().optional(),
	projectId: z.string().optional(),
	integrationId: z.string().optional(),
	search: z.string().optional(),
	dateRange: z.enum(["today", "week", "month", "overdue", "all"]).optional(),
	view: z
		.enum(["my-tasks", "team-tasks", "all-projects", "sprints"])
		.optional(),
});

export async function GET(
	req: NextRequest,
	{ params }: { params: { productId: string } }
) {
	const { productId } = await params;
	return withAuth(req, async (request, user) => {
		try {
			const { searchParams } = new URL(req.url);
			const query = taskQuerySchema.parse(
				Object.fromEntries(searchParams)
			);

			// Build where clause
			const where: any = {
				organizationId: productId,
			};

			if (query.status) where.status = query.status;
			if (query.priority) where.priority = query.priority;
			if (query.projectId) where.projectId = query.projectId;
			if (query.integrationId) where.integrationId = query.integrationId;

			// Handle view-specific filters
			if (query.view === "my-tasks") {
				where.assigneeId = user.id;
			}

			// Handle assignee filter
			if (query.assigneeId === "me") {
				where.assigneeId = user.id;
			} else if (query.assigneeId === "unassigned") {
				where.assigneeId = null;
			} else if (query.assigneeId) {
				where.assigneeId = query.assigneeId;
			}

			// Handle date range filters
			const now = new Date();
			if (query.dateRange === "today") {
				const startOfDay = new Date(now.setHours(0, 0, 0, 0));
				const endOfDay = new Date(now.setHours(23, 59, 59, 999));
				where.dueDate = { gte: startOfDay, lte: endOfDay };
			} else if (query.dateRange === "week") {
				const weekFromNow = new Date(
					now.getTime() + 7 * 24 * 60 * 60 * 1000
				);
				where.dueDate = { lte: weekFromNow };
			} else if (query.dateRange === "month") {
				const monthFromNow = new Date(
					now.getTime() + 30 * 24 * 60 * 60 * 1000
				);
				where.dueDate = { lte: monthFromNow };
			} else if (query.dateRange === "overdue") {
				where.dueDate = { lt: now };
				where.status = { not: "done" };
			}

			// Handle search
			if (query.search) {
				where.OR = [
					{ title: { contains: query.search, mode: "insensitive" } },
					{
						description: {
							contains: query.search,
							mode: "insensitive",
						},
					},
					{
						externalId: {
							contains: query.search,
							mode: "insensitive",
						},
					},
				];
			}

			const tasks = await prisma.task.findMany({
				where,
				include: {
					project: {
						select: {
							id: true,
							name: true,
							platform: true,
							status: true,
						},
					},
					integration: {
						select: {
							id: true,
							platform: true,
							status: true,
						},
					},
					assignee: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
					comments: {
						select: {
							id: true,
						},
					},
					linkedItems: {
						select: {
							id: true,
						},
					},
					watchers: {
						where: {
							userId: user.id,
						},
						select: {
							id: true,
						},
					},
				},
				orderBy: [
					{ status: "asc" },
					{ priority: "desc" },
					{ dueDate: "asc" },
				],
			});

			// Transform to match frontend expectations
			const transformedTasks = tasks.map((task) => ({
				id: task.id,
				externalId: task.externalId,
				title: task.title,
				description: task.description,
				status: task.status,
				priority: task.priority,
				type: task.type,
				assignee: task.assignee
					? {
							id: task.assignee.id,
							name: task.assignee.name,
							email: task.assignee.email,
							avatar: task.assignee.image,
						}
					: task.assigneeName
						? {
								id: task.assigneeId,
								name: task.assigneeName,
								avatar: task.assigneeAvatar,
							}
						: null,
				reporterId: task.reporterId,
				reporterName: task.reporterName,
				dueDate: task.dueDate,
				startDate: task.startDate,
				completedAt: task.completedAt,
				estimatedHours: task.estimatedHours,
				actualHours: task.actualHours,
				storyPoints: task.storyPoints,
				labels: task.labels,
				sprintId: task.sprintId,
				sprintName: task.sprintName,
				epicId: task.epicId,
				epicName: task.epicName,
				parentTaskId: task.parentTaskId,
				dependencies: task.dependencies,
				url: task.url,
				metadata: task.metadata,
				project: task.project,
				sourceTool: task.integration.platform,
				integrationId: task.integration.id,
				commentsCount: task.comments.length,
				linkedItemsCount: task.linkedItems.length,
				isWatching: task.watchers.length > 0,
				createdAt: task.createdAt,
				updatedAt: task.updatedAt,
				syncedAt: task.syncedAt,
			}));

			return NextResponse.json({ tasks: transformedTasks });
		} catch (error) {
			console.error("Error fetching tasks:", error);
			return NextResponse.json(
				{ error: "Failed to fetch tasks" },
				{ status: 500 }
			);
		}
	});
}
