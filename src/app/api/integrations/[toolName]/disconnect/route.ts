import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;
		try {
			await prisma.integration.deleteMany({
				where: { organizationId: user.organizationId, toolName },
			});

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
