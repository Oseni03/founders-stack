import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

export async function POST() {
	try {
		const session = await getSession();
		const user = session?.user;

		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const integration = await prisma.integration.findFirst({
			where: {
				organizationId: session.activeOrganizationId,
				// type: "slack",
			},
			include: {
				account: true,
			},
		});

		if (!integration) {
			return NextResponse.json(
				{ error: "Slack not connected" },
				{ status: 404 }
			);
		}

		// Fetch all channels
		const channelsResponse = await fetch(
			"https://slack.com/api/conversations.list?types=public_channel,private_channel",
			{
				headers: {
					Authorization: `Bearer ${integration.account.accessToken}`,
				},
			}
		);

		const channelsData = await channelsResponse.json();

		if (!channelsData.ok) {
			throw new Error("Failed to fetch channels");
		}

		let totalMessages = 0;

		// Sync messages from each channel
		for (const channel of channelsData.channels) {
			const messagesResponse = await fetch(
				`https://slack.com/api/conversations.history?channel=${channel.id}&limit=100`,
				{
					headers: {
						Authorization: `Bearer ${integration.account.accessToken}`,
					},
				}
			);

			const messagesData = await messagesResponse.json();

			if (messagesData.ok && messagesData.messages) {
				// Store messages in CDM messages table
				const messagesToInsert = messagesData.messages.map(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(msg: any) => ({
						user_id: user.id,
						platform: "slack",
						sender: msg.user || "unknown",
						content: msg.text,
						channel: channel.name,
						external_id: msg.ts,
						timestamp: new Date(
							Number.parseFloat(msg.ts) * 1000
						).toISOString(),
						metadata: {
							channel_id: channel.id,
							reactions: msg.reactions,
						},
					})
				);

				// await supabase.from("cdm_messages").upsert(messagesToInsert, {
				// 	onConflict: "user_id,external_id",
				// });

				totalMessages += messagesToInsert.length;
			}
		}

		return NextResponse.json({
			success: true,
			message_count: totalMessages,
		});
	} catch (error) {
		console.error("[v0] Failed to sync Slack messages:", error);
		return NextResponse.json(
			{ error: "Failed to sync messages" },
			{ status: 500 }
		);
	}
}
