import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { syncGitHub } from "@/server/platforms/github";
import { syncAsana } from "@/server/platforms/asana";
import { syncPostHog } from "@/server/platforms/posthog";
import { syncStripe } from "@/server/platforms/stripe";
import { syncSlack } from "@/server/platforms/slack";
import { syncCanny } from "@/server/platforms/canny";

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(req, async (request, user) => {
		try {
			const { toolName } = await params;

			switch (toolName) {
				case "github":
					await syncGitHub(user.organizationId);
				case "asana":
					await syncAsana(user.organizationId);
				case "posthog":
					await syncPostHog(user.organizationId);
				case "stripe":
					await syncStripe(user.organizationId);
				case "slack":
					await syncSlack(user.organizationId);
				case "canny":
					await syncCanny(user.organizationId);

				default:
					break;
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
