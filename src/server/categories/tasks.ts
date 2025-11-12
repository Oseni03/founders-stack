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
import logger from "@/lib/logger"; // Import the logger

export async function saveProjects(
	organizationId: string,
	sourceTool: string,
	projects: ProjectData[]
) {
	try {
		logger.info("Starting project save operation", {
			organizationId,
			sourceTool,
			projectCount: projects.length,
		});

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

		logger.info("Projects saved successfully", {
			organizationId,
			sourceTool,
			savedCount: projs.length,
		});

		if (sourceTool === "asana") {
			logger.debug("Syncing projects with Asana", { organizationId });
			await syncAsana(organizationId, projs);
		} else if (sourceTool === "jira") {
			logger.debug("Syncing projects with Jira", { organizationId });
			await syncJira(organizationId, projs);
		} else if (sourceTool === "slack") {
			logger.debug("Syncing projects with Slack", { organizationId });
			await syncSlack(organizationId, projs);
		} else if (sourceTool === "canny") {
			logger.debug("Syncing projects with Canny", { organizationId });
			await syncCanny(organizationId, projs);
		} else {
			logger.warn("No sync function available for tool", { sourceTool });
			console.error("Sync function not available for ", sourceTool);
		}

		return projects;
	} catch (error: any) {
		logger.error("Failed to save projects", {
			organizationId,
			sourceTool,
			error: error.message,
			stack: error.stack,
		});
		throw new Error(
			`Failed to save ${sourceTool} projects due to an internal error`
		);
	}
}

export async function getTasks(organizationId: string) {
	logger.info("Fetching tasks for organization", { organizationId });
	const tasks = await prisma.task.findMany({ where: { organizationId } });
	logger.debug("Tasks fetched successfully", {
		organizationId,
		taskCount: tasks.length,
	});
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
	logger.info("Creating task in platform", {
		toolName,
		projectExternalId: taskData.projectExternalId,
	});

	switch (toolName.toLowerCase()) {
		case "jira": {
			const cloudId = (integration.attributes as Record<string, any>)
				?.cloudId;
			const accessToken = integration.accessToken;
			if (!accessToken) {
				logger.error("Jira not connected: Missing access token", {
					toolName,
				});
				throw new Error("Jira not connected");
			}
			logger.debug("Initializing Jira connector", { toolName, cloudId });
			const jira = new JiraConnector(accessToken, cloudId);
			// Map taskData to Jira issue payload
			try {
				const result = await jira.createIssue(
					taskData.projectExternalId,
					{
						title: taskData.title,
						description: taskData.description,
						assigneeId: taskData.assignee || undefined,
						dueDate: taskData.dueDate
							? new Date(taskData.dueDate)
							: undefined,
						priority: taskData.priority,
						labels: taskData.labels || [],
					}
				);
				logger.info("Task created in Jira", {
					toolName,
					externalId: result.externalId,
				});
				return result;
			} catch (error: any) {
				logger.error("Failed to create task in Jira", {
					toolName,
					error: error.message,
					stack: error.stack,
				});
				throw error;
			}
		}
		case "asana": {
			const accessToken = integration.apiKey;
			if (!accessToken) {
				logger.error("Asana not connected: Missing access token", {
					toolName,
				});
				throw new Error("Asana not connected");
			}
			logger.debug("Initializing Asana connector", { toolName });
			const asana = new AsanaConnector(accessToken);
			try {
				const result = await asana.createTask(
					taskData.projectExternalId,
					{
						title: taskData.title,
						description: taskData.description,
						assigneeId: taskData.assignee || undefined,
						dueDate: taskData.dueDate || undefined,
						priority: taskData.priority || undefined,
						labels: taskData.labels || [],
						completed: taskData.status === "done",
					}
				);
				logger.info("Task created in Asana", {
					toolName,
					externalId: result.externalId,
				});
				return result;
			} catch (error: any) {
				logger.error("Failed to create task in Asana", {
					toolName,
					error: error.message,
					stack: error.stack,
				});
				throw error;
			}
		}
		default:
			logger.error("Unsupported tool for task creation", { toolName });
			throw new Error(`Unsupported tool: ${toolName}`);
	}
}

export async function updateTaskInPlatform(
	toolName: string,
	integration: Integration,
	taskData: TaskData
) {
	logger.info("Updating task in platform", {
		toolName,
		externalId: taskData.externalId,
	});

	const attributes = integration.attributes as Record<string, any>;
	const accessToken = integration.accessToken;
	if (!accessToken) {
		logger.error("Missing access token for task update", { toolName });
		throw new Error("Access token not found");
	}

	switch (toolName.toLowerCase()) {
		case "jira": {
			const cloudId = attributes?.cloudId;
			logger.debug("Initializing Jira connector for task update", {
				toolName,
				cloudId,
			});
			const jira = new JiraConnector(accessToken, cloudId);
			try {
				const result = await jira.updateIssue(taskData.externalId, {
					title: taskData.title,
					description: taskData.description,
					assigneeId: taskData.assignee || undefined,
					dueDate: taskData.dueDate
						? new Date(taskData.dueDate)
						: null,
					priority: taskData.priority || null,
					labels: taskData.labels,
					status: taskData.status,
				});
				logger.info("Task updated in Jira", {
					toolName,
					externalId: taskData.externalId,
				});
				return result;
			} catch (error: any) {
				logger.error("Failed to update task in Jira", {
					toolName,
					externalId: taskData.externalId,
					error: error.message,
					stack: error.stack,
				});
				throw error;
			}
		}
		case "asana": {
			logger.debug("Initializing Asana connector for task update", {
				toolName,
			});
			const asana = new AsanaConnector(accessToken!);
			try {
				const result = await asana.updateTask(taskData.externalId, {
					title: taskData.title,
					description: taskData.description,
					assigneeId: taskData.assignee || null,
					dueDate: taskData.dueDate || null,
					priority: taskData.priority || null,
					labels: taskData.labels,
					completed: taskData.status === "done",
				});
				logger.info("Task updated in Asana", {
					toolName,
					externalId: taskData.externalId,
				});
				return result;
			} catch (error: any) {
				logger.error("Failed to update task in Asana", {
					toolName,
					externalId: taskData.externalId,
					error: error.message,
					stack: error.stack,
				});
				throw error;
			}
		}
		default:
			logger.error("Unsupported tool for task update", { toolName });
			throw new Error(`Unsupported tool: ${toolName}`);
	}
}

export async function deleteTask(taskId: string) {
	logger.info("Deleting task", { taskId });
	try {
		const result = await prisma.task.delete({ where: { id: taskId } });
		logger.info("Task deleted successfully", { taskId });
		return result;
	} catch (error: any) {
		logger.error("Failed to delete task", {
			taskId,
			error: error.message,
			stack: error.stack,
		});
		throw error;
	}
}
