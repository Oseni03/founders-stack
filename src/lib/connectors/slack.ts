/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaginatedResponse, PaginationOptions } from "@/types/connector";
import { z } from "zod";

export interface ChannelData {
	externalId: string;
	name: string;
	description?: string;
	avatarUrl?: string;
	url?: string;
	platform: string;
	status: string;
	metadata: Record<string, any>;
}

export interface MessageData {
	externalId: string;
	channelId: string;
	channelName: string;
	channelType: string;
	content: string;
	authorId?: string;
	authorName: string;
	authorAvatar?: string;
	mentions: string[];
	reactions?: any;
	threadId?: string;
	parentMessageId?: string;
	hasAttachments: boolean;
	attachments?: any;
	isPinned: boolean;
	isImportant: boolean;
	url?: string;
	timestamp: Date;
	platform: string;
	metadata?: Record<string, any>;
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

	/**
	 * Fetch user info for a given user ID
	 */
	private async getUserInfo(userId: string): Promise<any> {
		try {
			const response = await this.apiRequest("users.info", {
				user: userId,
			});
			return response.user;
		} catch (error) {
			console.error(`Failed to fetch user info for ${userId}:`, error);
			return null;
		}
	}

	/**
	 * Fetch channels (public and private)
	 */
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
				page > 1 ? "next_cursor_from_previous_call" : undefined;

			const apiParams: Record<string, any> = {
				limit,
				cursor,
				types: "public_channel,private_channel",
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
					description:
						channel.purpose?.value ||
						channel.topic?.value ||
						undefined,
					avatarUrl: undefined, // Slack channels don't have avatars
					url: undefined, // Can be constructed if needed
					platform: "slack",
					status: channel.is_archived ? "archived" : "active",
					metadata: {
						is_private: channel.is_private,
						is_channel: channel.is_channel,
						is_group: channel.is_group,
						is_im: channel.is_im,
						is_mpim: channel.is_mpim,
						topic: channel.topic?.value || "",
						purpose: channel.purpose?.value || "",
						num_members: channel.num_members,
						created: channel.created,
						creator: channel.creator,
						is_shared: channel.is_shared,
						is_org_shared: channel.is_org_shared,
						is_ext_shared: channel.is_ext_shared,
						is_general: channel.is_general,
						unlinked: channel.unlinked,
					},
				})
			);

			const total = channels.length;
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

	/**
	 * Fetch messages from a channel
	 */
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
				page > 1 ? "timestamp_from_previous_call" : undefined;

			const apiParams: Record<string, any> = {
				channel: channelId,
				limit,
				latest,
			};

			const [messagesResponse, channelInfo] = await Promise.all([
				this.apiRequest("conversations.history", apiParams),
				this.apiRequest("conversations.info", { channel: channelId }),
			]);

			const messages: any[] = messagesResponse.messages || [];
			const channel = channelInfo.channel;

			// Determine channel type
			const getChannelType = (channel: any): string => {
				if (channel.is_im) return "DM";
				if (channel.is_mpim) return "DM";
				if (channel.is_group) return "CHANNEL"; // Private channel
				return "CHANNEL";
			};

			const channelType = getChannelType(channel);

			// Fetch user info for messages (batch if possible)
			const uniqueUserIds = [
				...new Set(
					messages.map((m) => m.user).filter(Boolean) as string[]
				),
			];

			const userInfoMap = new Map<string, any>();
			await Promise.all(
				uniqueUserIds.map(async (userId) => {
					const userInfo = await this.getUserInfo(userId);
					if (userInfo) {
						userInfoMap.set(userId, userInfo);
					}
				})
			);

			const mappedMessages: MessageData[] = messages
				.filter(
					(message: any) =>
						!message.subtype ||
						message.subtype === "thread_broadcast"
				)
				.map((message: any) => {
					const userInfo = message.user
						? userInfoMap.get(message.user)
						: null;

					// Extract mentions from text
					const mentions =
						message.text
							?.match(/<@([A-Z0-9]+)>/g)
							?.map((m: string) => m.replace(/<@|>/g, "")) || [];

					// Check if message has attachments
					const hasAttachments =
						(message.files && message.files.length > 0) ||
						(message.attachments && message.attachments.length > 0);

					return {
						externalId: message.ts,
						channelId: channelId,
						channelName: channel.name || "Unknown",
						channelType: channelType,
						content: message.text || "",
						authorId: message.user,
						authorName:
							userInfo?.real_name ||
							userInfo?.name ||
							message.user ||
							"Unknown",
						authorAvatar: userInfo?.profile?.image_72,
						mentions: mentions,
						reactions: message.reactions
							? message.reactions.map((r: any) => ({
									name: r.name,
									count: r.count,
									users: r.users,
								}))
							: undefined,
						threadId: message.thread_ts,
						parentMessageId:
							message.thread_ts !== message.ts
								? message.thread_ts
								: undefined,
						hasAttachments: hasAttachments,
						attachments: hasAttachments
							? {
									files: message.files || [],
									attachments: message.attachments || [],
								}
							: undefined,
						isPinned:
							message.pinned_to?.includes(channelId) || false,
						isImportant: false, // Can be determined by custom logic
						url: message.permalink,
						timestamp: new Date(parseFloat(message.ts) * 1000),
						platform: "slack",
						metadata: {
							subtype: message.subtype,
							edited: message.edited,
							client_msg_id: message.client_msg_id,
							team: message.team,
							bot_id: message.bot_id,
							bot_profile: message.bot_profile,
							blocks: message.blocks,
							is_starred: message.is_starred,
							reply_count: message.reply_count,
							reply_users_count: message.reply_users_count,
							latest_reply: message.latest_reply,
						},
					};
				});

			const total = messages.length;
			const totalPages = Math.ceil(total / limit);
			const hasMore =
				messagesResponse.has_more || messages.length === limit;

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

	/**
	 * Fetch messages in a thread
	 */
	async fetchThreadMessages(
		channelId: string,
		threadTs: string,
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
			const cursor = page > 1 ? "cursor_from_previous_call" : undefined;

			const apiParams: Record<string, any> = {
				channel: channelId,
				ts: threadTs,
				limit,
				cursor,
			};

			const [repliesResponse, channelInfo] = await Promise.all([
				this.apiRequest("conversations.replies", apiParams),
				this.apiRequest("conversations.info", { channel: channelId }),
			]);

			const messages: any[] = repliesResponse.messages || [];
			const channel = channelInfo.channel;

			const getChannelType = (channel: any): string => {
				if (channel.is_im) return "DM";
				if (channel.is_mpim) return "DM";
				if (channel.is_group) return "CHANNEL";
				return "CHANNEL";
			};

			const channelType = getChannelType(channel);

			// Get unique user IDs
			const uniqueUserIds = [
				...new Set(
					messages.map((m) => m.user).filter(Boolean) as string[]
				),
			];

			const userInfoMap = new Map<string, any>();
			await Promise.all(
				uniqueUserIds.map(async (userId) => {
					const userInfo = await this.getUserInfo(userId);
					if (userInfo) {
						userInfoMap.set(userId, userInfo);
					}
				})
			);

			const mappedMessages: MessageData[] = messages.map(
				(message: any) => {
					const userInfo = message.user
						? userInfoMap.get(message.user)
						: null;

					const mentions =
						message.text
							?.match(/<@([A-Z0-9]+)>/g)
							?.map((m: string) => m.replace(/<@|>/g, "")) || [];

					const hasAttachments =
						(message.files && message.files.length > 0) ||
						(message.attachments && message.attachments.length > 0);

					return {
						externalId: message.ts,
						channelId: channelId,
						channelName: channel.name || "Unknown",
						channelType: "THREAD",
						content: message.text || "",
						authorId: message.user,
						authorName:
							userInfo?.real_name ||
							userInfo?.name ||
							message.user ||
							"Unknown",
						authorAvatar: userInfo?.profile?.image_72,
						mentions: mentions,
						reactions: message.reactions,
						threadId: threadTs,
						parentMessageId:
							message.ts !== threadTs ? threadTs : undefined,
						hasAttachments: hasAttachments,
						attachments: hasAttachments
							? {
									files: message.files || [],
									attachments: message.attachments || [],
								}
							: undefined,
						isPinned: false,
						isImportant: false,
						url: message.permalink,
						timestamp: new Date(parseFloat(message.ts) * 1000),
						platform: "slack",
						metadata: {
							subtype: message.subtype,
							edited: message.edited,
							client_msg_id: message.client_msg_id,
							team: message.team,
						},
					};
				}
			);

			const total = messages.length;
			const totalPages = Math.ceil(total / limit);
			const hasMore =
				!!repliesResponse.response_metadata?.next_cursor ||
				messages.length === limit;

			return {
				resources: mappedMessages,
				page,
				limit,
				total,
				totalPages,
				hasMore,
			};
		} catch (error) {
			console.error("[SLACK_FETCH_THREAD_MESSAGES_ERROR]", error);
			throw new Error(
				`Failed to fetch Slack thread messages: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Test the Slack connection
	 */
	async testConnection(): Promise<boolean> {
		try {
			const response = await this.apiRequest("auth.test");
			return response.ok;
		} catch (error) {
			console.error("[SLACK_TEST_CONNECTION_ERROR]", error);
			return false;
		}
	}
}
