/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";

export async function createMessage({
	externalId,
	text,
	user,
	channelId,
	sourceTool,
	organizationId,
	timestamp,
	attributes,
}: {
	externalId: string;
	text: string;
	user: string;
	channelId: string;
	sourceTool: string;
	organizationId: string;
	timestamp: string;
	attributes: Record<string, any>;
}) {
	try {
		const message = await prisma.message.create({
			data: {
				externalId,
				text: text,
				user,
				channelId,
				sourceTool,
				organizationId,
				timestamp: new Date(parseFloat(timestamp) * 1000),
				attributes,
			},
		});
		return message;
	} catch (error) {
		console.error("Failed to create message:", error);
		throw new Error("Failed to create message due to an internal error");
	}
}

export async function updateMessage({
	externalId,
	sourceTool,
	text,
	attributes,
}: {
	externalId: string;
	sourceTool: string;
	text: string;
	attributes: Record<string, any>;
}) {
	try {
		const message = await prisma.message.update({
			where: {
				externalId_sourceTool: {
					externalId,
					sourceTool,
				},
			},
			data: {
				text,
				updatedAt: new Date(),
				attributes,
			},
		});
		return message;
	} catch (error) {
		console.error("Failed to update message:", error);
		throw new Error("Failed to update message due to an internal error");
	}
}

export async function deleteMessage(externalId: string, sourceTool: string) {
	try {
		return await prisma.message.delete({
			where: {
				externalId_sourceTool: {
					externalId,
					sourceTool,
				},
			},
		});
	} catch (error) {
		console.error("Failed to delete message:", error);
		throw new Error("Failed to delete message due to an internal error");
	}
}

export async function updateProject({
	externalId,
	sourceTool,
	data,
}: {
	externalId: string;
	sourceTool: string;
	data: Record<string, any>;
}) {
	try {
		const project = await prisma.project.update({
			where: {
				externalId_sourceTool: {
					externalId,
					sourceTool,
				},
			},
			data,
		});
		return project;
	} catch (error) {
		console.error("Failed to update project:", error);
		throw new Error("Failed to update project due to an internal error");
	}
}
