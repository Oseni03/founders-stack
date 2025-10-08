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

			// Get pagination params from query string
			const searchParams = request.nextUrl.searchParams;
			const page = parseInt(searchParams.get("page") || "1");
			const limit = Math.min(
				parseInt(searchParams.get("limit") || "50"),
				100
			); // Max 100
			const search = searchParams.get("search") || "";

			const connector = new GitHubConnector(
				integration?.account.accessToken
			);

			const result = await connector.fetchRepositories({
				page,
				limit,
				search,
			});

			return NextResponse.json({
				data: result.repositories,
				pagination: {
					page: result.page,
					limit: result.limit,
					total: result.total,
					totalPages: result.totalPages,
					hasMore: result.hasMore,
				},
			});
		} catch (error) {
			console.error("Failed to fetch GitHub repositories:", error);
			return NextResponse.json(
				{ error: "Failed to fetch repositories" },
				{ status: 500 }
			);
		}
	});
}
