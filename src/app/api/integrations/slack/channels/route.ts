import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { withAuth } from "@/lib/middleware";

export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			const { accessToken } = await auth.api.getAccessToken({
				body: {
					providerId: "slack", // or any other provider id
					// accountId: "accountId", // optional, if you want to get the access token for a specific account
					userId: user.id, // optional, if you don't provide headers with authenticated token
				},
				headers: await headers(),
			});

			if (!accessToken) {
				return NextResponse.json(
					{ error: "Slack not connected" },
					{ status: 404 }
				);
			}

			// const integration = await prisma.integration.findFirst({
			// 	where: {
			// 		organizationId: session.activeOrganizationId,
			// 		type: "slack",
			// 		id: integrationId!,
			// 		status: IntegrationStatus.active,
			// 	},
			// 	include: {
			// 		account: true,
			// 	},
			// });

			// if (!integration) {
			// 	return NextResponse.json(
			// 		{ error: "Slack not connected" },
			// 		{ status: 404 }
			// 	);
			// }

			// Fetch channels from Slack API
			const response = await fetch(
				"https://slack.com/api/conversations.list?types=public_channel,private_channel",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
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
			console.error("Failed to fetch Slack channels:", error);
			return NextResponse.json(
				{ error: "Failed to fetch channels" },
				{ status: 500 }
			);
		}
	});
}
