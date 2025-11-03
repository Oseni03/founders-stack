/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaginatedResponse, PaginationOptions } from "@/types/connector";
import { z } from "zod";

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
