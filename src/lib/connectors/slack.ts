/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaginatedResponse, PaginationOptions } from "@/types/connector";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getIntegration } from "@/server/integrations";
import { Project } from "@prisma/client";
import {
	createMessage,
	deleteMessage,
	updateMessage,
	updateProject,
} from "@/server/messages";

export interface ChannelData {
	externalId: string;
	name: string;
	description: string;
	attributes: Record<string, any>;
}

export interface MessageData {
	externalId: string;
	text: string;
	user: string;
	timestamp: Date;
	attributes: Record<string, any>;
}

const paramsSchema = z.object({
	page: z.number().min(1, "Page must be at least 1"),
	limit: z.number().min(1).max(1000, "Limit must be between 1 and 1000"),
	search: z.string().default(""),
});

export class SlackConnector {
	private accessToken: string;
	private baseUrl: string = "https://slack.com/api";

	constructor(accessToken: string) {
		this.accessToken = accessToken;
	}

	private async apiRequest(
		endpoint: string,
		params: Record<string, any> = {}
	): Promise<any> {
		const url = new URL(`${this.baseUrl}/${endpoint}`);
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				url.searchParams.append(key, value.toString());
			}
		});

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				Accept: "application/json",
			},
		});

		const data = await response.json().catch(() => ({}));

		if (!data.ok) {
			throw new Error(
				`Slack API error: ${data.error || "Unknown error"}`
			);
		}

		return data;
	}

	async fetchChannels(
		params: PaginationOptions
	): Promise<PaginatedResponse<ChannelData>> {
		try {
			const parsedParams = paramsSchema.safeParse(params);
			if (!parsedParams.success) {
				throw new Error(
					`Invalid parameters: ${parsedParams.error.message}`
				);
			}

			const { page, limit, search } = parsedParams.data;
			const cursor =
				page > 1 ? "next_cursor_from_previous_call" : undefined; // Use Slack's cursor for pagination

			const apiParams: Record<string, any> = {
				limit,
				cursor,
				types: "public_channel,private_channel", // Fetch both public and private channels
				exclude_archived: true,
			};

			const response = await this.apiRequest(
				"conversations.list",
				apiParams
			);

			let channels: any[] = response.channels || [];

			if (search) {
				channels = channels.filter((channel: any) =>
					channel.name.toLowerCase().includes(search.toLowerCase())
				);
			}

			const mappedChannels: ChannelData[] = channels.map(
				(channel: any) => ({
					externalId: channel.id,
					name: channel.name,
					description: channel.purpose?.value || "",
					attributes: {
						is_private: channel.is_private,
						is_channel: channel.is_channel,
						topic: channel.topic?.value || "",
						num_members: channel.num_members,
						created: channel.created,
					},
				})
			);

			const total = channels.length; // Approximate; Slack doesn't provide total_count
			const totalPages = Math.ceil(total / limit);
			const hasMore =
				!!response.response_metadata?.next_cursor ||
				channels.length === limit;

			return {
				resources: mappedChannels,
				page,
				limit,
				total,
				totalPages,
				hasMore,
			};
		} catch (error) {
			console.error("[SLACK_FETCH_CHANNELS_ERROR]", error);
			throw new Error(
				`Failed to fetch Slack channels: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	async fetchMessages(
		channelId: string,
		params: PaginationOptions
	): Promise<PaginatedResponse<MessageData>> {
		try {
			const parsedParams = paramsSchema.safeParse(params);
			if (!parsedParams.success) {
				throw new Error(
					`Invalid parameters: ${parsedParams.error.message}`
				);
			}

			const { page, limit } = parsedParams.data;
			const latest =
				page > 1 ? "timestamp_from_previous_call" : undefined; // Use timestamps for pagination

			const apiParams: Record<string, any> = {
				channel: channelId,
				limit,
				latest,
			};

			const response = await this.apiRequest(
				"conversations.history",
				apiParams
			);

			const messages: any[] = response.messages || [];

			const mappedMessages: MessageData[] = messages.map(
				(message: any) => ({
					externalId: message.ts,
					text: message.text,
					user: message.user,
					timestamp: new Date(parseFloat(message.ts) * 1000),
					attributes: {
						subtype: message.subtype,
						attachments: message.attachments || [],
						reactions: message.reactions || [],
					},
				})
			);

			const total = messages.length;
			const totalPages = Math.ceil(total / limit);
			const hasMore = response.has_more || messages.length === limit;

			return {
				resources: mappedMessages,
				page,
				limit,
				total,
				totalPages,
				hasMore,
			};
		} catch (error) {
			console.error("[SLACK_FETCH_MESSAGES_ERROR]", error);
			throw new Error(
				`Failed to fetch Slack messages: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}
}

export async function syncSlack(organizationId: string, projs: Project[] = []) {
	const integration = await getIntegration(organizationId, "slack");
	if (!integration?.account.accessToken) {
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

	const connector = new SlackConnector(integration.account.accessToken);

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

	console.log(`✅ Slack sync completed for organization: ${organizationId}`);
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
		await updateProject({
			externalId: channelId,
			sourceTool: "slack",
			data: {
				status: "archived",
				attributes: {
					deleted: true,
					deleted_at: new Date().toISOString(),
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
		await updateProject({
			externalId: channelId,
			sourceTool: "slack",
			data: {
				status: "archived",
				attributes: {
					left: true,
					left_at: new Date().toISOString(),
					user_id: event.user,
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
		await updateProject({
			externalId: channelId,
			sourceTool: "slack",
			data: {
				status: "archived",
				attributes: {
					deleted: true,
					deleted_at: new Date().toISOString(),
					channel_type: "group",
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
		await updateProject({
			externalId: channelId,
			sourceTool: "slack",
			data: {
				status: "archived",
				attributes: {
					left: true,
					left_at: new Date().toISOString(),
					user_id: event.user,
					channel_type: "group",
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
