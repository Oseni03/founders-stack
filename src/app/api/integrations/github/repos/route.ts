import { type NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/server/integrations";
import { withAuth } from "@/lib/middleware";
import { GitHubConnector } from "@/lib/connectors/github";

export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			const integration = await getIntegration(
				user.organizationId,
				"github"
			);

			if (!integration?.account.accessToken) {
				return NextResponse.json(
					{ error: "Github not connected" },
					{ status: 404 }
				);
			}

			const connector = new GitHubConnector(
				integration?.account.accessToken
			);

			const data = await connector.fetchRepositories();

			return NextResponse.json({ data });
		} catch (error) {
			console.error("Failed to fetch GitHub repositories:", error);
			return NextResponse.json(
				{ error: "Failed to fetch repositories" },
				{ status: 500 }
			);
		}
	});
}
