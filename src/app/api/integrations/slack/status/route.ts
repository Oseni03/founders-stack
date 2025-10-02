import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		const session = await getSession();
		const user = session?.user;

		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const integration = await prisma.integration.findFirst({
			where: {
				organizationId: session.activeOrganizationId,
				// type: "slack",
			},
			include: {
				account: true,
			},
		});

		if (!integration) {
			return NextResponse.json({ connected: false });
		}

		return NextResponse.json({
			connected: true,
			// workspace_name: integration.team_name,
			// connected_at: integration.connected_at,
		});
	} catch (error) {
		console.error("[v0] Failed to check Slack status:", error);
		return NextResponse.json(
			{ error: "Failed to check status" },
			{ status: 500 }
		);
	}
}
