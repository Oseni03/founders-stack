"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth-utils";

// Input validation schemas
const CommentSchema = z.object({
	feedbackId: z.cuid(),
	content: z.string().min(1, "Comment cannot be empty"),
});

const LinkToJiraSchema = z.object({
	feedbackId: z.cuid(),
	jiraTicketId: z.string().min(1, "Jira ticket ID is required"),
});

export async function getFeedbackItems(organizationId: string, filters = {}) {
	const session = await getSession();
	if (!session?.user) throw new Error("Unauthorized");

	try {
		return await prisma.feedbackItem.findMany({
			where: {
				organizationId,
				...filters,
			},
			include: {
				project: true,
				integration: true,
				comments: {
					include: {
						author: true,
						replies: true,
					},
				},
				linkedItems: true,
			},
			orderBy: { createdAt: "desc" },
		});
	} catch (error) {
		console.error("Error fetching feedback items:", error);
		throw new Error("Failed to fetch feedback items");
	}
}

export async function updateFeedbackStatus(id: string, status: string) {
	const session = await getSession();
	if (!session?.user) throw new Error("Unauthorized");

	try {
		await prisma.feedbackItem.update({
			where: { id },
			data: { status },
		});
		revalidatePath("/feedback");
	} catch (error) {
		console.error("Error updating feedback status:", error);
		throw new Error("Failed to update feedback status");
	}
}

export async function assignFeedback(id: string, assignedTo: string) {
	const session = await getSession();
	if (!session?.user) throw new Error("Unauthorized");

	try {
		await prisma.feedbackItem.update({
			where: { id },
			data: { assignedTo },
		});
		revalidatePath("/feedback");
	} catch (error) {
		console.error("Error assigning feedback:", error);
		throw new Error("Failed to assign feedback");
	}
}

export async function addComment(
	organizationId: string,
	feedbackId: string,
	content: string
) {
	const session = await getSession();
	if (!session?.user) throw new Error("Unauthorized");

	// Validate input
	const validated = CommentSchema.safeParse({ feedbackId, content });
	if (!validated.success) {
		throw new Error(validated.error.message);
	}

	try {
		await prisma.comment.create({
			data: {
				content,
				entityType: "FEEDBACK",
				entityId: feedbackId,
				authorId: session.user.id,
				organizationId,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		revalidatePath("/feedback");
	} catch (error) {
		console.error("Error adding comment:", error);
		throw new Error("Failed to add comment");
	}
}

export async function linkToJira(feedbackId: string, jiraTicketId: string) {
	const session = await getSession();
	if (!session?.user) throw new Error("Unauthorized");

	// Validate input
	const validated = LinkToJiraSchema.safeParse({ feedbackId, jiraTicketId });
	if (!validated.success) {
		throw new Error(validated.error.message);
	}

	try {
		await prisma.linkedItem.create({
			data: {
				sourceType: "FEEDBACK",
				sourceId: feedbackId,
				targetType: "TICKET",
				targetId: jiraTicketId,
				linkType: "RELATED_TO",
				userId: session.user.id,
				createdBy: session.user.email || session.user.id,
				// organizationId,
				createdAt: new Date(),
			},
		});
		revalidatePath("/feedback");
	} catch (error) {
		console.error("Error linking to Jira:", error);
		throw new Error("Failed to link to Jira ticket");
	}
}
