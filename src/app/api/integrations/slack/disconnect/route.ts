import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST() {
	try {
		const session = await getSession();
		const user = session?.user;

		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Delete Slack integration
		await prisma.integration.delete({
			where: {
				accountId: user.id,
				organizationId: session.activeOrganizationId!,
				// type: "slack",
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[v0] Failed to disconnect Slack:", error);
		return NextResponse.json(
			{ error: "Failed to disconnect" },
			{ status: 500 }
		);
	}
}
