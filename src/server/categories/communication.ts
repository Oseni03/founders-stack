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

export async function createChannel(data: any) {
	const { organizationId, name, description, externalId } = data;

	const channel = await prisma.project.create({
		data: {
			organizationId,
			name,
			description: description || null,
			externalId: externalId || null,
			sourceTool: "slack",
			status: "active",
			attributes: {
				is_private: false,
				num_members: 0,
			},
		},
	});

	return channel;
}

export async function deleteChannel(channelId: string) {
	// Soft delete by updating status
	await prisma.project.delete({
		where: { id: channelId },
	});
}

export async function syncMessages(data: any) {
	const { organizationId, channelId, messages } = data;

	// Upsert messages (insert or update based on externalId + sourceTool)
	const upsertPromises = messages.map((msg: any) =>
		prisma.message.upsert({
			where: {
				externalId_sourceTool: {
					externalId: msg.externalId,
					sourceTool: "slack",
				},
			},
			update: {
				text: msg.text,
				user: msg.user,
				timestamp: new Date(msg.timestamp),
				attributes: msg.attributes || {},
				updatedAt: new Date(),
			},
			create: {
				externalId: msg.externalId,
				text: msg.text,
				user: msg.user || null,
				channelId,
				sourceTool: "slack",
				organizationId,
				timestamp: new Date(msg.timestamp),
				attributes: msg.attributes || {},
			},
		})
	);

	return await Promise.all(upsertPromises);
}

export async function calculateSentiment(messages: any[]): Promise<number> {
	if (messages.length === 0) return 0.5;

	// Simplified sentiment analysis
	// In production, use a proper NLP library or API
	const positiveWords = [
		"great",
		"awesome",
		"excellent",
		"good",
		"thanks",
		"perfect",
	];
	const negativeWords = [
		"issue",
		"problem",
		"bug",
		"error",
		"failed",
		"wrong",
	];

	let score = 0;
	messages.forEach((msg) => {
		const text = msg.text.toLowerCase();
		positiveWords.forEach((word) => {
			if (text.includes(word)) score += 1;
		});
		negativeWords.forEach((word) => {
			if (text.includes(word)) score -= 1;
		});
	});

	// Normalize to 0-1 range
	const normalized = (score + messages.length) / (messages.length * 2);
	return Math.max(0, Math.min(1, normalized));
}

export async function generateInsight(
	messageVolume: number,
	unreadMentions: number,
	sentiment: number,
	channelCount: number
): Promise<string> {
	const insights = [];

	if (messageVolume > 1000) {
		insights.push("High communication volume detected");
	} else if (messageVolume < 100) {
		insights.push("Communication activity is lower than usual");
	}

	if (unreadMentions > 10) {
		insights.push(`${unreadMentions} unread mentions require attention`);
	}

	if (sentiment >= 0.7) {
		insights.push("Overall team sentiment is positive");
	} else if (sentiment < 0.4) {
		insights.push(
			"Team sentiment shows some concerns - consider checking in"
		);
	}

	if (channelCount > 10) {
		insights.push("Consider consolidating channels for better focus");
	}

	return insights.length > 0
		? insights.join(". ") + "."
		: "Communication patterns are within normal ranges.";
}
