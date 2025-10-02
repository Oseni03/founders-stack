import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

		// Fetch channels from Slack API
		const response = await fetch(
			"https://slack.com/api/conversations.list?types=public_channel,private_channel",
			{
				headers: {
					Authorization: `Bearer ${integration.account.accessToken}`,
				},
			}
		);

		const data = await response.json();

		if (!data.ok) {
			throw new Error("Failed to fetch channels");
		}

		return NextResponse.json({
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			channels: data.channels.map((channel: any) => ({
				id: channel.id,
				name: channel.name,
				is_private: channel.is_private,
				is_member: channel.is_member,
				num_members: channel.num_members,
			})),
		});
	} catch (error) {
		console.error("[v0] Failed to fetch Slack channels:", error);
		return NextResponse.json(
			{ error: "Failed to fetch channels" },
			{ status: 500 }
		);
	}
}
