/* eslint-disable @typescript-eslint/no-explicit-any */
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { updateTaskInPlatform } from "@/server/categories/tasks";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: { toolName: string; taskId: string } }
) {
	return withAuth(req, async (request, user) => {
		try {
			const { toolName, taskId } = params;
			const body = await req.json();
			const { organizationId, ...updates } = body;

			if (organizationId !== user.organizationId) {
				return NextResponse.json(
					{ error: "Forbidden" },
					{ status: 403 }
				);
			}

			// Get task details
			const [task, integration] = await Promise.all([
				prisma.task.findUnique({
					where: { id: taskId },
				}),
				prisma.integration.findUnique({
					where: {
						organizationId_toolName: {
							organizationId,
							toolName,
						},
					},
				}),
			]);

			if (!task || task.organizationId !== organizationId) {
				return NextResponse.json(
					{ error: "Task not found" },
					{ status: 404 }
				);
			}

			if (!integration) {
				return NextResponse.json(
					{ error: `${toolName} integration not found` },
					{ status: 404 }
				);
			}

			// Update task in external platform
			let updatedTask;
			try {
				const updatedResp = await updateTaskInPlatform(
					toolName,
					integration,
					{
						externalId: task.externalId!,
						...updates,
					}
				);
				// Update task in local database
				updatedTask = await prisma.task.update({
					where: { id: taskId },
					data: {
						...(updatedResp.title && { title: updatedResp.title }),
						...(updatedResp.description !== undefined && {
							description: updatedResp.description,
						}),
						...(updatedResp.status && {
							status: updatedResp.status,
						}),
						...(updatedResp.priority && {
							priority: updatedResp.priority,
						}),
						...(updatedResp.assignee !== undefined && {
							assignee: updatedResp.assignee,
						}),
						...(updatedResp.dueDate !== undefined && {
							dueDate: updatedResp.dueDate
								? new Date(updatedResp.dueDate)
								: null,
						}),
						...(updatedResp.labels && {
							labels: updatedResp.labels,
						}),
						attributes: updatedResp.attributes,
						lastSyncedAt: new Date(),
					},
				});
			} catch (error: any) {
				return NextResponse.json(
					{
						error: `Failed to update task in ${toolName}: ${error.message}`,
					},
					{ status: 500 }
				);
			}

			return NextResponse.json(updatedTask);
		} catch (error: any) {
			console.error("Error updating task:", error);
			return NextResponse.json(
				{ error: error.message || "Internal server error" },
				{ status: 500 }
			);
		}
	});
}
