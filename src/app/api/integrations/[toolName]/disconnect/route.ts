import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { disconnectGitHubIntegration } from "@/server/platforms/github";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;
		try {
			switch (toolName) {
				case "github":
					await disconnectGitHubIntegration(user.organizationId);

				default:
					await prisma.integration.update({
						where: {
							organizationId_platform: {
								organizationId: user.organizationId,
								platform: toolName,
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
