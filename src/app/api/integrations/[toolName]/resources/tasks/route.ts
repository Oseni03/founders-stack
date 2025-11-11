/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";
import { createTaskInPlatform } from "@/server/categories/tasks";

// Create a new task (sync to integrated platform and save locally)
export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	const { toolName } = await params;
	return withAuth(req, async (request, user) => {
		try {
			const body = await req.json();
			const {
				organizationId,
				projectId,
				title,
				description,
				status,
				priority,
				assignee,
				dueDate,
				labels,
			} = body;

			// Validate required fields
			if (!organizationId || !projectId || !title) {
				return NextResponse.json(
					{ error: "Missing required fields" },
					{ status: 400 }
				);
			}

			if (organizationId !== user.organizationId) {
				return NextResponse.json(
					{ error: "Forbidden" },
					{ status: 403 }
				);
			}

			// Get project details
			const project = await prisma.project.findUnique({
				where: { id: projectId },
				include: {
					organization: {
						include: {
							integrations: {
								where: {
									toolName,
									status: "CONNECTED",
								},
							},
						},
					},
				},
			});

			if (
				!project ||
				project.organizationId !== organizationId ||
				!project.externalId
			) {
				return NextResponse.json(
					{ error: "Project not found" },
					{ status: 404 }
				);
			}

			const integration = project.organization.integrations[0];
			if (!integration) {
				return NextResponse.json(
					{ error: `${toolName} integration not found` },
					{ status: 404 }
				);
			}

			// Create task in external platform
			let task;
			try {
				const externalTask = await createTaskInPlatform(
					toolName,
					integration,
					{
						projectExternalId: project.externalId,
						title,
						description,
						status,
						priority,
						assignee,
						dueDate,
						labels,
					}
				);

				// Save task to local database using connector response shape
				task = await prisma.task.create({
					data: {
						organizationId,
						projectId,
						externalId: externalTask?.externalId,
						sourceTool: toolName,
						title: externalTask.title,
						description: externalTask.description,
						status: externalTask.status,
						priority: externalTask.priority,
						assignee: externalTask.assignee,
						assigneeId:
							externalTask?.assigneeId ??
							externalTask?.assignee ??
							null,
						url: externalTask?.url ?? null,
						dueDate: externalTask.dueDate
							? new Date(externalTask.dueDate)
							: null,
						labels: externalTask.labels || [],
						attributes: externalTask?.attributes || {},
						lastSyncedAt: new Date(),
					},
				});
			} catch (error: any) {
				return NextResponse.json(
					{
						error: `Failed to create task in ${toolName}: ${error.message}`,
					},
					{ status: 500 }
				);
			}

			return NextResponse.json(task, { status: 201 });
		} catch (error: any) {
			console.error("Error creating task:", error);
			return NextResponse.json(
				{ error: error.message || "Internal server error" },
				{ status: 500 }
			);
		}
	});
}
