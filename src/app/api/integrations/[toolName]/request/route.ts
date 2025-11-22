import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;
		const { organizationId, reason } = await request.json();

		await prisma.integrationRequest.create({
			data: {
				organizationId,
				platform: toolName,
				requestedById: user.id,
				reason,
			},
		});

		return new NextResponse("Request submitted");
	});
}
