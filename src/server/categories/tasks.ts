/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { Task } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function fetchTasks(filters = {}) {
	try {
		const tasks = await prisma.task.findMany({
			where: filters,
			include: {
				project: true,
				integration: true,
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
				metadata: data.metadata as Record<string, any>,
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
