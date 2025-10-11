import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { syncGitHub } from "@/lib/connectors/github";
import { syncAsana } from "@/lib/connectors/asana";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(req, async (request, user) => {
		try {
			const { toolName } = await params;

			if (toolName === "github") {
				await syncGitHub(user.organizationId);
			} else if (toolName === "asana") {
				await syncAsana(user.organizationId);
			}

			return NextResponse.json({
				message: "Sync completed successfully",
			});
		} catch (error) {
			console.error("GitHub sync error:", error);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	});
}
