import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id: providerId } = await params;
	try {
		const { integrationId } = await request.json();

		const integration = await prisma.integration.findFirst({
			where: { id: integrationId },
		});

		if (!integration) {
			return NextResponse.json(
				{ error: "Account not connected" },
				{ status: 404 }
			);
		}

		await auth.api.unlinkAccount({
			body: { providerId, accountId: integration.accountId },
			headers: await headers(),
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error disconnecting/unlinking Integration: ", error);
		return NextResponse.json(
			{ error: `Failed to fetch disconnect ${providerId}` },
			{ status: 500 }
		);
	}
}
