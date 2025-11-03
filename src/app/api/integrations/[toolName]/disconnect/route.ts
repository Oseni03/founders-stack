import { disconnectJiraIntegration } from "@/server/platforms/jira";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { disconnectAsanaIntegration } from "@/server/platforms/asana";
import { disconnectPostHogIntegration } from "@/server/platforms/posthog";
import { disconnectStripeIntegration } from "@/server/platforms/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;
		try {
			switch (toolName) {
				case "asana":
					await disconnectAsanaIntegration(user.organizationId);

				case "stripe":
					await disconnectStripeIntegration(user.organizationId);

				case "posthog":
					await disconnectPostHogIntegration(user.organizationId);

				case "jira":
					await disconnectJiraIntegration(user.organizationId);

				default:
					await prisma.integration.update({
						where: {
							organizationId_toolName: {
								organizationId: user.organizationId,
								toolName: "asana",
							},
						},
						data: {
							status: "DISCONNECTED",
							webhookId: null,
							webhookUrl: null,
						},
					});
			}

			return NextResponse.json({ success: true });
		} catch (error) {
			console.error("Error disconnecting Integration: ", error);
			return NextResponse.json(
				{ error: `Failed to disconnect integration` },
				{ status: 500 }
			);
		}
	});
}
