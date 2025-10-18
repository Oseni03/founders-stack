/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaginatedResponse, PaginationOptions } from "@/types/connector";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getIntegration } from "@/server/integrations";
import { Project } from "@prisma/client";

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
	private refreshTokenValue: string | null;
	private organizationId: string | null;
	private baseUrl: string = "https://slack.com/api";

	constructor(
		accessToken: string,
		refreshToken: string | null,
		organizationId: string | null
	) {
		this.accessToken = accessToken;
		this.refreshTokenValue = refreshToken;
		this.organizationId = organizationId;
	}

	private async refreshToken(): Promise<{
		accessToken: string;
		refreshToken: string;
	}> {
		try {
			if (!this.refreshTokenValue || !this.organizationId) {
				throw new Error("Missing refresh token or organization ID");
			}

			const response = await fetch(`${this.baseUrl}/oauth.v2.access`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
				},
				body: new URLSearchParams({
					client_id: process.env.SLACK_CLIENT_ID || "",
					client_secret: process.env.SLACK_CLIENT_SECRET || "",
					refresh_token: this.refreshTokenValue,
				}),
			});

			const data = await response.json();
			if (!data.ok) {
				throw new Error(
					`Token refresh failed: ${data.error || "Unknown error"}`
				);
			}

			const newAccessToken = data.access_token;
			const newRefreshToken =
				data.refresh_token || this.refreshTokenValue;

			// Update UserIntegration
			const integration = await getIntegration(
				this.organizationId,
				"slack"
			);

			await prisma.account.update({
				where: { id: integration?.account.id },
				data: {
					accessToken: newAccessToken,
					refreshToken: newRefreshToken,
				},
			});

			this.accessToken = newAccessToken;
			this.refreshTokenValue = newRefreshToken;

			return {
				accessToken: newAccessToken,
				refreshToken: newRefreshToken,
			};
		} catch (error) {
			throw new Error(
				`Failed to refresh Slack token: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	private async apiRequest(
		endpoint: string,
		params: Record<string, any> = {},
		retryCount: number = 0
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
		if (data.error === "token_expired" && retryCount < 1) {
			try {
				await this.refreshToken();
				return this.apiRequest(endpoint, params, retryCount + 1);
			} catch (refreshError) {
				throw refreshError;
			}
		}

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

	const connector = new SlackConnector(
		integration.account.accessToken,
		integration.account.refreshToken,
		organizationId
	);

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
