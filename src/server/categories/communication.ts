/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function getMessages(organizationId: string) {
	const session = await getSession();
	if (!session?.user.id) throw new Error("Unauthorized");

	return prisma.message.findMany({
		where: { organizationId },
		orderBy: { timestamp: "desc" },
		include: { comments: true, linkedItems: true },
	});
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

interface CreateMessageData {
	externalId: string;
	content: string;
	authorId?: string;
	authorName: string;
	authorAvatar?: string;
	projectId: string;
	channelId: string;
	channelName: string;
	channelType: string;
	platform: string;
	organizationId: string;
	timestamp: string | Date;
	mentions?: string[];
	reactions?: any;
	threadId?: string;
	parentMessageId?: string;
	hasAttachments?: boolean;
	attachments?: any;
	isPinned?: boolean;
	isImportant?: boolean;
	url?: string;
	metadata?: any;
}

export async function createMessage(data: CreateMessageData) {
	try {
		const message = await prisma.message.create({
			data: {
				externalId: data.externalId,
				content: data.content,
				authorId: data.authorId,
				authorName: data.authorName,
				authorAvatar: data.authorAvatar,
				projectId: data.projectId,
				channelId: data.channelId,
				channelName: data.channelName,
				channelType: data.channelType,
				platform: data.platform,
				organizationId: data.organizationId,
				timestamp: new Date(data.timestamp),
				mentions: data.mentions || [],
				reactions: data.reactions || undefined,
				threadId: data.threadId,
				parentMessageId: data.parentMessageId,
				hasAttachments: data.hasAttachments || false,
				attachments: data.attachments || undefined,
				isPinned: data.isPinned || false,
				isImportant: data.isImportant || false,
				url: data.url,
				metadata: data.metadata || undefined,
				syncedAt: new Date(),
			},
		});

		return { success: true, data: message };
	} catch (error) {
		console.error("Error creating message:", error);
		throw error;
	}
}

interface UpdateMessageData {
	externalId: string;
	platform: string;
	organizationId: string;
	content?: string;
	isPinned?: boolean;
	isImportant?: boolean;
	reactions?: any;
	metadata?: any;
}

export async function updateMessage(data: UpdateMessageData) {
	try {
		const message = await prisma.message.update({
			where: {
				externalId_platform_organizationId: {
					externalId: data.externalId,
					platform: data.platform,
					organizationId: data.organizationId,
				},
			},
			data: {
				...(data.content !== undefined && { content: data.content }),
				...(data.isPinned !== undefined && { isPinned: data.isPinned }),
				...(data.isImportant !== undefined && {
					isImportant: data.isImportant,
				}),
				...(data.reactions !== undefined && {
					reactions: data.reactions,
				}),
				...(data.metadata !== undefined && { metadata: data.metadata }),
				syncedAt: new Date(),
			},
		});

		return { success: true, data: message };
	} catch (error) {
		console.error("Error updating message:", error);
		throw error;
	}
}

export async function deleteMessage(
	externalId: string,
	platform: string,
	organizationId: string
) {
	try {
		await prisma.message.delete({
			where: {
				externalId_platform_organizationId: {
					externalId,
					platform,
					organizationId,
				},
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error deleting message:", error);
		throw error;
	}
}

// ============================================================================
// PROJECT (CHANNEL) OPERATIONS
// ============================================================================

interface UpdateProjectData {
	externalId: string;
	platform: string;
	organizationId: string;
	name?: string;
	description?: string;
	avatarUrl?: string;
	url?: string;
	status?: string;
	metadata?: any;
}

export async function updateProject(data: UpdateProjectData) {
	try {
		const project = await prisma.project.update({
			where: {
				externalId_platform: {
					externalId: data.externalId,
					platform: data.platform,
				},
			},
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.description !== undefined && {
					description: data.description,
				}),
				...(data.avatarUrl !== undefined && {
					avatarUrl: data.avatarUrl,
				}),
				...(data.url !== undefined && { url: data.url }),
				...(data.status !== undefined && { status: data.status }),
				...(data.metadata !== undefined && { metadata: data.metadata }),
				updatedAt: new Date(),
			},
		});

		return { success: true, data: project };
	} catch (error) {
		console.error("Error updating project:", error);
		throw error;
	}
}

export async function deleteProject(externalId: string, platform: string) {
	try {
		await prisma.project.delete({
			where: {
				externalId_platform: {
					externalId,
					platform,
				},
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error deleting project:", error);
		throw error;
	}
}
