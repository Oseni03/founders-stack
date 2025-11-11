/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { syncAsana } from "../platforms/asana";
import { syncJira } from "@/server/platforms/jira";
import { syncSlack } from "../platforms/slack";
import { prisma } from "@/lib/prisma";
import { ProjectData } from "@/types/connector";
import { syncCanny } from "../platforms/canny";
import { AsanaConnector, TaskData } from "@/lib/connectors/asana";
import { JiraConnector } from "@/lib/connectors/jira";
import { Integration, TaskPriority, TaskStatus } from "@prisma/client";

export async function saveProjects(
	organizationId: string,
	sourceTool: string,
	projects: ProjectData[]
) {
	try {
		const projs = await prisma.$transaction(
			projects.map((project) =>
				prisma.project.upsert({
					where: {
						externalId_sourceTool: {
							externalId: project.externalId,
							sourceTool,
						},
					},
					update: {
						...project,
						attributes: project.attributes,
					},
					create: {
						...project,
						organizationId,
						sourceTool,
						attributes: project.attributes,
					},
				})
			)
		);

		if (sourceTool === "asana") {
			await syncAsana(organizationId, projs);
		} else if (sourceTool === "jira") {
			await syncJira(organizationId, projs);
		} else if (sourceTool === "slack") {
			await syncSlack(organizationId, projs);
		} else if (sourceTool === "canny") {
			await syncCanny(organizationId, projs);
		} else {
			console.error("Sync function not available for ", sourceTool);
		}

		return projects;
	} catch (error) {
		console.error(`Failed to save ${sourceTool} projects:`, error);
		throw new Error(
			`Failed to save ${sourceTool} projects due to an internal error`
		);
	}
}

export async function getTasks(organizationId: string) {
	const tasks = await prisma.task.findMany({ where: { organizationId } });
	return tasks;
}

// Helper functions for platform-specific task operations
export async function createTaskInPlatform(
	toolName: string,
	integration: Integration,
	taskData: {
		projectExternalId: string;
		title: string;
		description: string;
		assignee: string;
		dueDate?: string;
		priority?: TaskPriority;
		labels: string[];
		status?: TaskStatus;
	}
) {
	switch (toolName.toLowerCase()) {
		case "jira": {
			// Jira connector expects an access token and cloudId
			const cloudId = (integration.attributes as Record<string, any>)
				?.cloudId;
			const accessToken = integration.accessToken;
			if (!accessToken) {
				throw new Error("Jira not connected");
			}
			const jira = new JiraConnector(accessToken, cloudId);
			// Map taskData to Jira issue payload
			return jira.createIssue(taskData.projectExternalId, {
				title: taskData.title,
				description: taskData.description,
				assigneeId: taskData.assignee || undefined,
				dueDate: taskData.dueDate
					? new Date(taskData.dueDate)
					: undefined,
				priority: taskData.priority,
				labels: taskData.labels || [],
			});
		}
		case "asana": {
			const accessToken = integration.accessToken;
			if (!accessToken) {
				throw new Error("Asana not connected");
			}
			const asana = new AsanaConnector(accessToken);
			return asana.createTask(taskData.projectExternalId, {
				title: taskData.title,
				description: taskData.description,
				assigneeId: taskData.assignee || undefined,
				dueDate: taskData.dueDate || undefined,
				priority: taskData.priority || undefined,
				labels: taskData.labels || [],
				completed: taskData.status === "done",
			});
		}
		default:
			throw new Error(`Unsupported tool: ${toolName}`);
	}
}

export async function updateTaskInPlatform(
	toolName: string,
	integration: Integration,
	taskData: TaskData
) {
	const attributes = integration.attributes as Record<string, any>;
	const accessToken = integration.accessToken;
	if (!accessToken) {
		throw new Error("Access token not found");
	}
	switch (toolName.toLowerCase()) {
		case "jira": {
			const cloudId = attributes?.cloudId;
			const jira = new JiraConnector(accessToken, cloudId);
			return jira.updateIssue(taskData.externalId, {
				title: taskData.title,
				description: taskData.description,
				assigneeId: taskData.assignee || undefined,
				dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
				priority: taskData.priority || null,
				labels: taskData.labels,
				status: taskData.status,
			});
		}
		case "asana": {
			const accessToken = integration.accessToken;
			const asana = new AsanaConnector(accessToken!);
			return asana.updateTask(taskData.externalId, {
				title: taskData.title,
				description: taskData.description,
				assigneeId: taskData.assignee || null,
				dueDate: taskData.dueDate || null,
				priority: taskData.priority || null,
				labels: taskData.labels,
				completed: taskData.status === "done",
			});
		}
		default:
			throw new Error(`Unsupported tool: ${toolName}`);
	}
}

export async function deleteTask(taskId: string) {
	return await prisma.task.delete({ where: { id: taskId } });
}
