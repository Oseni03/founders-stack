/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { prisma } from "@/lib/prisma";
import { ProjectData } from "@/types/connector";
import { Task } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function fetchTasks(filters = {}) {
	try {
		const tasks = await prisma.task.findMany({
			where: filters,
			include: {
				project: true,
				comments: { include: { author: true } },
				linkedItems: true,
				watchers: true,
			},
			orderBy: { dueDate: "asc" },
		});
		return tasks;
	} catch (error) {
		console.error("Error fetching tasks:", error);
		throw new Error("Failed to fetch tasks");
	}
}

export async function fetchProjects() {
	try {
		const projects = await prisma.project.findMany({
			where: { status: "active" },
			orderBy: { name: "asc" },
		});
		return projects;
	} catch (error) {
		console.error("Error fetching projects:", error);
		throw new Error("Failed to fetch projects");
	}
}

export async function updateTask(
	id: string,
	organizationId: string,
	data: Partial<Task>
) {
	try {
		const updatedTask = await prisma.task.update({
			where: { id },
			data: {
				...data,
				organizationId,
				attributes: data.attributes as Record<string, any>,
				updatedAt: new Date(),
				syncedAt: new Date(),
			},
		});
		revalidatePath("/tasks");
		return updatedTask;
	} catch (error) {
		console.error("Error updating task:", error);
		throw new Error("Failed to update task");
	}
}

export async function addComment(
	organizationId: string,
	taskId: string,
	content: string,
	authorId: string
) {
	try {
		const comment = await prisma.comment.create({
			data: {
				content,
				entityType: "TASK",
				entityId: taskId,
				authorId,
				organizationId,
				createdAt: new Date(),
			},
		});
		revalidatePath("/tasks");
		return comment;
	} catch (error) {
		console.error("Error adding comment:", error);
		throw new Error("Failed to add comment");
	}
}

export async function saveProjects(
	organizationId: string,
	platform: string,
	data: ProjectData[]
) {
	try {
		const results = await Promise.allSettled(
			data.map((project) =>
				prisma.project.upsert({
					where: {
						externalId_platform: {
							externalId: project.externalId,
							platform: platform,
						},
					},
					update: {
						name: project.name,
						description: project.description,
						avatarUrl: project.avatarUrl,
						url: project.url,
						status: project.status ?? "active",
						attributes: project.attributes ?? undefined,
						updatedAt: new Date(),
					},
					create: {
						externalId: project.externalId,
						name: project.name,
						description: project.description,
						avatarUrl: project.avatarUrl,
						url: project.url,
						platform: platform,
						status: project.status ?? "active",
						attributes: project.attributes ?? undefined,
						organizationId,
					},
				})
			)
		);

		const successful = results.filter(
			(r) => r.status === "fulfilled"
		).length;
		const failed = results.filter((r) => r.status === "rejected");

		if (failed.length > 0) {
			console.error(
				"Failed to save some projects:",
				failed.map((f) => (f.status === "rejected" ? f.reason : null))
			);
		}

		return {
			success: true,
			saved: successful,
			failed: failed.length,
			total: data.length,
		};
	} catch (error) {
		console.error("Error saving projects:", error);
		throw new Error("Failed to save projects");
	}
}
