import { auth } from "@/lib/auth";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id: integrationId } = await params;
	try {
		const session = await getSession();
		const user = session?.user;

		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Add Permission authorization

		const integration = await prisma.integration.findFirst({
			where: { id: integrationId },
		});

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
}
