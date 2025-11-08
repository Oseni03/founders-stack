/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import {
	calculateMessageVolumeTrend,
	calculateSentiment,
	deleteChannel,
	generateInsight,
	syncMessages,
} from "@/server/categories/communication";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	const { productId } = await params;
	return withAuth(
		request,
		async (request, user) => {
			try {
				const searchParams = request.nextUrl.searchParams;
				const range = searchParams.get("range") || "30d";

				// Calculate date range
				const days = parseInt(range.replace("d", ""));
				const startDate = new Date();
				startDate.setDate(startDate.getDate() - days);

				// Fetch channels (Projects) for the organization
				const channels = await prisma.project.findMany({
					where: {
						organizationId: user.organizationId,
						status: "active",
					},
					select: {
						id: true,
						name: true,
						description: true,
						externalId: true,
						attributes: true,
					},
				});

				// Fetch messages for all channels within the date range
				const messages = await prisma.message.findMany({
					where: {
						organizationId: user.organizationId,
						timestamp: {
							gte: startDate,
						},
					},
					orderBy: {
						timestamp: "desc",
					},
					select: {
						id: true,
						externalId: true,
						text: true,
						user: true,
						channelId: true,
						timestamp: true,
						attributes: true,
					},
				});

				// Group messages by channel
				const messagesByChannel: Record<string, any[]> = {};
				channels.forEach((channel) => {
					messagesByChannel[channel.id] = messages.filter(
						(msg) => msg.channelId === channel.id
					);
				});

				// Calculate metrics
				const messageVolume = messages.length;

				// Calculate unread mentions (from message attributes)
				const unreadMentions = messages.filter((msg) => {
					const attrs = msg.attributes as any;
					return attrs?.has_mention && !attrs?.is_read;
				}).length;

				// Calculate sentiment (simplified - in production, use NLP analysis)
				const sentiment = await calculateSentiment(messages);

				// Get recent threads with mentions
				const recentThreads = messages
					.filter((msg) => {
						const attrs = msg.attributes as any;
						return attrs?.thread_ts && attrs?.reply_count > 0;
					})
					.slice(0, 5)
					.map((msg) => {
						const attrs = msg.attributes as any;
						const channel = channels.find(
							(c) => c.id === msg.channelId
						);
						return {
							id: msg.id,
							channel: channel?.name || "Unknown",
							preview: msg.text.substring(0, 100),
							mentions: attrs?.mention_count || 0,
						};
					});

				// Generate insight
				const insight = await generateInsight(
					messageVolume,
					unreadMentions,
					sentiment,
					channels.length
				);

				// Calculate message volume trend (last 7 days)
				const messageVolumeTrendData =
					await calculateMessageVolumeTrend(
						user.organizationId,
						7 // last 7 days
					);

				return NextResponse.json({
					channels: channels.map((ch) => ({
						id: ch.id,
						name: ch.name,
						description: ch.description || "",
					})),
					messagesByChannel,
					messageVolume,
					unreadMentions,
					sentiment,
					recentThreads,
					insight,
					messageVolumeTrendData, // Add this
				});
			} catch (error) {
				console.error("[Communication API] Error:", error);
				return NextResponse.json(
					{ error: "Failed to fetch communication data" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, data } = body;

		switch (action) {
			case "deleteChannel":
				await deleteChannel(data.channelId);
				return NextResponse.json({
					success: true,
				});
			case "syncMessages":
				const messages = await syncMessages(data);
				return NextResponse.json({
					success: true,
					synced: messages.length,
				});
			default:
				return NextResponse.json(
					{ error: "Invalid action" },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error("[Communication API] POST Error:", error);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 }
		);
	}
}
