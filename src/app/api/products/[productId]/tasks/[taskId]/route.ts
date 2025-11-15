import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";

const updateTaskSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	status: z.string().optional(),
	priority: z.string().optional(),
	assigneeId: z.string().nullable().optional(),
	dueDate: z.string().datetime().nullable().optional(),
	labels: z.array(z.string()).optional(),
	storyPoints: z.number().optional(),
});

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; taskId: string }> }
) {
	const { productId, taskId } = await params;
	return withAuth(
		req,
		async () => {
			try {
				const task = await prisma.task.findFirst({
					where: {
						id: taskId,
						organizationId: productId,
					},
					include: {
						project: true,
						integration: true,
						assignee: true,
						comments: {
							include: {
								author: {
									select: {
										id: true,
										name: true,
										email: true,
										image: true,
									},
								},
							},
							orderBy: { createdAt: "desc" },
						},
						linkedItems: {
							include: {
								task: true,
								design: true,
								message: true,
							},
						},
						watchers: {
							include: {
								user: {
									select: {
										id: true,
										name: true,
										email: true,
										image: true,
									},
								},
							},
						},
					},
				});

				if (!task) {
					return NextResponse.json(
						{ error: "Task not found" },
						{ status: 404 }
					);
				}

				return NextResponse.json({ task });
			} catch (error) {
				console.error("Error fetching task:", error);
				return NextResponse.json(
					{ error: "Failed to fetch task" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; taskId: string }> }
) {
	const { productId, taskId } = await params;
	return withAuth(
		req,
		async (request, user) => {
			try {
				if (
					!user.role ||
					!["owner", "admin", "member"].includes(user.role)
				) {
					return NextResponse.json(
						{ error: "Forbidden" },
						{ status: 403 }
					);
				}

				const body = await req.json();
				const data = updateTaskSchema.parse(body);

				// Get the task with integration info
				const existingTask = await prisma.task.findFirst({
					where: {
						id: taskId,
						organizationId: productId,
					},
					include: {
						integration: true,
						project: true,
					},
				});

				if (!existingTask) {
					return NextResponse.json(
						{ error: "Task not found" },
						{ status: 404 }
					);
				}

				// If updating assignee, fetch user info
				let assigneeData = {};
				if (data.assigneeId !== undefined) {
					if (data.assigneeId) {
						const assignee = await prisma.user.findUnique({
							where: { id: data.assigneeId },
							select: { name: true, image: true },
						});
						assigneeData = {
							assigneeId: data.assigneeId,
							assigneeName: assignee?.name,
							assigneeAvatar: assignee?.image,
						};
					} else {
						assigneeData = {
							assigneeId: null,
							assigneeName: null,
							assigneeAvatar: null,
						};
					}
				}

				// Update local task
				const updatedTask = await prisma.task.update({
					where: { id: taskId },
					data: {
						...data,
						...assigneeData,
						dueDate: data.dueDate
							? new Date(data.dueDate)
							: undefined,
						syncedAt: new Date(),
					},
					include: {
						project: true,
						integration: true,
						assignee: true,
						comments: { select: { id: true } },
						linkedItems: { select: { id: true } },
					},
				});

				// TODO: Sync back to source tool (Jira/Linear/Asana) via integration
				// This would call the integration's API to update the external task

				return NextResponse.json({ task: updatedTask });
			} catch (error) {
				console.error("Error updating task:", error);
				return NextResponse.json(
					{ error: "Failed to update task" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; taskId: string }> }
) {
	const { productId, taskId } = await params;
	return withAuth(
		req,
		async (request, user) => {
			try {
				if (
					!user.role ||
					!["owner", "admin", "member"].includes(user.role)
				) {
					return NextResponse.json(
						{ error: "Forbidden" },
						{ status: 403 }
					);
				}

				// Delete task
				await prisma.task.delete({
					where: {
						id: taskId,
						organizationId: productId,
					},
				});

				// TODO: Optionally delete from source tool as well

				return NextResponse.json({ success: true });
			} catch (error) {
				console.error("Error deleting task:", error);
				return NextResponse.json(
					{ error: "Failed to delete task" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}
