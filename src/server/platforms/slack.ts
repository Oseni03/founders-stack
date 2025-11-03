/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { getIntegration } from "../integrations";
import { SlackConnector } from "@/lib/connectors/slack";
import { Project } from "@prisma/client";
import {
	createMessage,
	deleteMessage,
	updateMessage,
	updateProject,
} from "../categories/communication";

export async function syncSlack(organizationId: string, projs: Project[] = []) {
	const integration = await getIntegration(organizationId, "slack");
	if (!integration?.accessToken) {
		throw new Error("Integration not connected");
	}

	let projects;

	if (projs.length === 0) {
		projects = await prisma.project.findMany({
			where: { organizationId, sourceTool: "slack" },
		});
	} else {
		projects = projs;
	}

	if (projects.length === 0) return;

	const connector = new SlackConnector(integration.accessToken);

	const syncPromises = projects.map((project) => async () => {
		try {
			const { resources: messages } = await connector.fetchMessages(
				project.externalId!,
				{
					page: 1,
					limit: 50,
				}
			);

			await prisma.message.createMany({
				data: messages.map((message) => ({
					...message,
					organizationId,
					channelId: project.id,
					sourceTool: "slack",
				})),
				skipDuplicates: true,
			});
		} catch (error) {
			console.error(
				`❌ Sync failed for Slack project - ${project.name}:`,
				error
			);
		}
	});

	// Execute syncs with a concurrency limit (e.g., 5 concurrent syncs to respect GitHub API limits)
	const concurrencyLimit = 5;
	for (let i = 0; i < syncPromises.length; i += concurrencyLimit) {
		const batch = syncPromises.slice(i, i + concurrencyLimit);
		await Promise.all(batch.map((fn) => fn()));
	}

	console.log(`✅ Slack sync completed for project: ${organizationId}`);
}

// Main event processor
export async function processSlackEvent(payload: any) {
	const event = payload.event;
	const teamId = payload.team_id;

	console.log("Processing Slack event:", event.type, "for team:", teamId);

	const project = await prisma.project.findUnique({
		where: {
			externalId_sourceTool: {
				externalId: event.channel,
				sourceTool: "slack",
			},
		},
	});
	if (!project) {
		console.log("Channel not registered:", event.channel);
		return;
	}

	try {
		switch (event.type) {
			// Message events
			case "message":
				await handleMessageEvent(
					event,
					project.id,
					project.organizationId
				);
				break;

			// Channel events
			case "channel_deleted":
				await handleChannelDeleted(event);
				break;

			case "channel_left":
				await handleChannelLeft(event);
				break;

			case "channel_rename":
				await handleChannelRename(event);
				break;

			// Private channel (group) events
			case "group_deleted":
				await handleGroupDeleted(event);
				break;

			case "group_left":
				await handleGroupLeft(event);
				break;

			case "group_rename":
				await handleGroupRename(event);
				break;

			default:
				console.log("Unhandled event type:", event.type);
		}
	} catch (error) {
		console.error(`Error handling event ${event.type}:`, error);
		throw error;
	}
}

// ============================================================================
// MESSAGE EVENT HANDLERS
// ============================================================================

async function handleMessageEvent(
	event: any,
	projectId: string,
	organizationId: string
) {
	// Skip bot messages, message changes, and deletes (handle them separately if needed)
	if (
		event.subtype &&
		!["message_changed", "message_deleted"].includes(event.subtype)
	) {
		console.log("Skipping message subtype:", event.subtype);
		return;
	}

	// Handle new messages
	if (!event.subtype) {
		await handleNewMessage(event, projectId, organizationId);
	}
	// Handle message updates
	else if (event.subtype === "message_changed") {
		await handleMessageUpdate(event);
	}
	// Handle message deletions
	else if (event.subtype === "message_deleted") {
		await handleMessageDelete(event);
	}
}

async function handleNewMessage(
	event: any,
	projectId: string,
	organizationId: string
) {
	const channelId = event.channel;
	const messageTs = event.ts;
	const text = event.text || "";
	const userId = event.user;

	console.log("New message:", { channelId, messageTs, userId });

	// Determine channel type
	const channelType = event.channel_type || "channel"; // channel, group, im, mpim

	// Create message
	await createMessage({
		externalId: messageTs,
		text,
		user: userId,
		channelId: projectId,
		sourceTool: "slack",
		organizationId,
		timestamp: messageTs,
		attributes: {
			channel_type: channelType,
			thread_ts: event.thread_ts,
			team: event.team,
			event_ts: event.event_ts,
		},
	});

	console.log("Message stored successfully");
}

async function handleMessageUpdate(event: any) {
	const { message, previous_message } = event;

	if (!message || !message.ts) {
		console.log("Invalid message update event");
		return;
	}

	console.log("Updating message:", message.ts);

	try {
		await updateMessage({
			externalId: message.ts,
			sourceTool: "slack",
			text: message.text || "",
			attributes: {
				...(previous_message
					? { previous_text: previous_message.text }
					: {}),
				edited: true,
				edit_timestamp: new Date().toISOString(),
			},
		});

		console.log("Message updated successfully");
	} catch (error) {
		console.error("Error updating message:", error);
	}
}

async function handleMessageDelete(event: any) {
	const deletedTs = event.deleted_ts;

	if (!deletedTs) {
		console.log("Invalid message delete event");
		return;
	}

	console.log("Deleting message:", deletedTs);

	try {
		await deleteMessage(deletedTs, "slack");

		console.log("Message deleted successfully");
	} catch (error) {
		console.error("Error deleting message:", error);
	}
}

// ============================================================================
// CHANNEL EVENT HANDLERS
// ============================================================================

async function handleChannelDeleted(event: any) {
	const channelId = event.channel;

	console.log("Channel deleted:", channelId);

	try {
		await prisma.project.delete({
			where: {
				externalId_sourceTool: {
					externalId: channelId,
					sourceTool: "slack",
				},
			},
		});

		console.log("Channel marked as deleted");
	} catch (error) {
		console.error("Error marking channel as deleted:", error);
	}
}

async function handleChannelLeft(event: any) {
	const channelId = event.channel;

	console.log("Left channel:", channelId);

	try {
		await prisma.project.delete({
			where: {
				externalId_sourceTool: {
					externalId: channelId,
					sourceTool: "slack",
				},
			},
		});

		console.log("Channel marked as left");
	} catch (error) {
		console.error("Error marking channel as left:", error);
	}
}

async function handleChannelRename(event: any) {
	const channelId = event.channel.id;
	const newName = event.channel.name;

	console.log("Channel renamed:", channelId, "to", newName);

	try {
		await updateProject({
			externalId: channelId,
			sourceTool: "slack",
			data: {
				name: newName,
				attributes: {
					renamed: true,
					renamed_at: new Date().toISOString(),
					created: event.channel.created,
				},
			},
		});

		console.log("Channel renamed successfully");
	} catch (error) {
		console.error("Error renaming channel:", error);
	}
}

// ============================================================================
// PRIVATE CHANNEL (GROUP) EVENT HANDLERS
// ============================================================================

async function handleGroupDeleted(event: any) {
	const channelId = event.channel;

	console.log("Private channel deleted:", channelId);

	try {
		await prisma.project.delete({
			where: {
				externalId_sourceTool: {
					externalId: channelId,
					sourceTool: "slack",
				},
			},
		});

		console.log("Private channel marked as deleted");
	} catch (error) {
		console.error("Error marking private channel as deleted:", error);
	}
}

async function handleGroupLeft(event: any) {
	const channelId = event.channel;

	console.log("Left private channel:", channelId);

	try {
		await prisma.project.delete({
			where: {
				externalId_sourceTool: {
					externalId: channelId,
					sourceTool: "slack",
				},
			},
		});

		console.log("Private channel marked as left");
	} catch (error) {
		console.error("Error marking private channel as left:", error);
	}
}

async function handleGroupRename(event: any) {
	const channelId = event.channel.id;
	const newName = event.channel.name;

	console.log("Private channel renamed:", channelId, "to", newName);

	try {
		await updateProject({
			externalId: channelId,
			sourceTool: "slack",
			data: {
				name: newName,
				attributes: {
					renamed: true,
					renamed_at: new Date().toISOString(),
					channel_type: "group",
				},
			},
		});

		console.log("Private channel renamed successfully");
	} catch (error) {
		console.error("Error renaming private channel:", error);
	}
}
