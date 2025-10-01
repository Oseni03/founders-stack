import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ organizationId: string }> }
) {
	try {
		// Await the params Promise
		const { organizationId } = await params;

		const subscription = await prisma.subscription.findUnique({
			where: { organizationId: organizationId },
		});

		if (!subscription) {
			return NextResponse.json({ success: false });
		}

		return NextResponse.json({ data: subscription, success: true });
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: "Failed to fetch subscription" },
			{ status: 500 }
		);
	}
}
