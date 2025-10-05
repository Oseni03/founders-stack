import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { getIntegration } from "@/server/integrations";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;
		try {
			const integration = await getIntegration(
				user.organizationId,
				toolName
			);

			if (!integration) {
				return NextResponse.json(
					{ error: "Account not connected" },
					{ status: 404 }
				);
			}

			await prisma.account.delete({
				where: { id: integration.accountId },
			});

			return NextResponse.json({ success: true });
		} catch (error) {
			console.error("Error disconnecting/unlinking Integration: ", error);
			return NextResponse.json(
				{ error: `Failed to disconnect integration` },
				{ status: 500 }
			);
		}
	});
}
