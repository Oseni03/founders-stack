import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { syncGitHub } from "@/lib/connectors/github";
import { syncAsana } from "@/lib/connectors/asana";
import { syncPostHog } from "@/lib/connectors/posthog";
import { syncStripe } from "@/lib/connectors/stripe";
import { syncSlack } from "@/lib/connectors/slack";
import { syncCanny } from "@/lib/connectors/canny";

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
