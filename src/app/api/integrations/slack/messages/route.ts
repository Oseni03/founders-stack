/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const channelId = searchParams.get("channel");

		if (!channelId) {
			return NextResponse.json(
				{ error: "Channel ID required" },
				{ status: 400 }
			);
		}

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

		// Fetch messages from Slack API
		const response = await fetch(
			`https://slack.com/api/conversations.history?channel=${channelId}&limit=50`,
			{
				headers: {
					Authorization: `Bearer ${integration.account.accessToken}`,
				},
			}
		);

		const data = await response.json();

		if (!data.ok) {
			throw new Error("Failed to fetch messages");
		}

		// Fetch user info for messages
		const userIds = [
			...new Set(
				data.messages.map((msg: any) => msg.user).filter(Boolean)
			),
		];
		const userInfoPromises = userIds.map((userId) =>
			fetch(`https://slack.com/api/users.info?user=${userId}`, {
				headers: {
					Authorization: `Bearer ${integration.account.accessToken}`,
				},
			}).then((res) => res.json())
		);

		const userInfos = await Promise.all(userInfoPromises);
		const userMap = new Map(
			userInfos.map((info) => [
				info.user?.id,
				info.user?.real_name || info.user?.name,
			])
		);

		return NextResponse.json({
			messages: data.messages.map((msg: any) => ({
				id: msg.ts,
				text: msg.text,
				user: userMap.get(msg.user) || msg.user || "Unknown",
				timestamp: new Date(
					Number.parseFloat(msg.ts) * 1000
				).toLocaleString(),
				channel: channelId,
				reactions:
					msg.reactions?.reduce(
						(sum: number, r: any) => sum + r.count,
						0
					) || 0,
			})),
		});
	} catch (error) {
		console.error("[v0] Failed to fetch Slack messages:", error);
		return NextResponse.json(
			{ error: "Failed to fetch messages" },
			{ status: 500 }
		);
	}
}
