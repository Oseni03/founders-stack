/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/server/integrations";
import { withAuth } from "@/lib/middleware";
import { GitHubConnector } from "@/lib/connectors/github";
import { RepoData } from "@/types/code";
import { PaginatedResponse, Resources } from "@/types/connector";
import { z } from "zod";
import { AsanaConnector } from "@/lib/connectors/asana";
import { SlackConnector } from "@/lib/connectors/slack";
import { JiraConnector } from "@/lib/connectors/jira";
import { CannyConnector } from "@/lib/connectors/canny";

// Input validation schema
const querySchema = z.object({
	page: z
		.string()
		.optional()
		.transform((v) => parseInt(v || "1"))
		.refine((v) => v >= 1, "Page must be at least 1"),
	limit: z
		.string()
		.optional()
		.transform((v) => parseInt(v || "50"))
		.refine((v) => v >= 1 && v <= 100, "Limit must be between 1 and 100"),
	search: z.string().optional().default(""),
});

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;

		// Validate query parameters
		const searchParams = request.nextUrl.searchParams;
		const parsedParams = querySchema.safeParse({
			page: searchParams.get("page"),
			limit: searchParams.get("limit"),
			search: searchParams.get("search") || "",
		});

		if (!parsedParams.success) {
			console.error(
				"Error parsing resources query param: ",
				parsedParams.error
			);
			return NextResponse.json(
				{
					error: "Invalid query parameters",
					details: parsedParams.error,
				},
				{ status: 400 }
			);
		}

		const { page, limit, search } = parsedParams.data;

		try {
			// Fetch integration
			const integration = await getIntegration(
				user.organizationId,
				toolName
			);

			if (
				!integration?.account.accessToken &&
				!integration?.account.apiKey
			) {
				return NextResponse.json(
					{
						error: `${toolName.charAt(0).toUpperCase() + toolName.slice(1)} not connected`,
					},
					{ status: 404 }
				);
			}

			let resources: Resources[] = [];
			let pagination = {
				page,
				limit,
				total: 0,
				totalPages: 0,
				hasMore: false,
			};

			if (toolName === "github") {
				const connector = new GitHubConnector(
					integration.account.accessToken!
				);
				const result: PaginatedResponse<RepoData> =
					await connector.fetchRepositories({
						page,
						limit,
						search,
					});

				resources = result.resources;

				pagination = {
					page: result.page,
					limit: result.limit,
					total: result.total,
					totalPages: result.totalPages,
					hasMore: result.hasMore,
				};
			} else if (toolName === "asana") {
				const connector = new AsanaConnector(
					integration.account.apiKey!
				);

				const result = await connector.fetchProjects({
					page,
					limit,
					search,
				});

				resources = result.resources;
				pagination = {
					page: result.page,
					limit: result.limit,
					total: result.total,
					totalPages: result.totalPages,
					hasMore: result.hasMore,
				};
			} else if (toolName === "slack") {
				const connector = new SlackConnector(
					integration.account.accessToken!
				);

				const result = await connector.fetchChannels({
					page,
					limit,
					search,
				});

				resources = result.resources;
				pagination = {
					page: result.page,
					limit: result.limit,
					total: result.total,
					totalPages: result.totalPages,
					hasMore: result.hasMore,
				};
			} else if (toolName === "jira") {
				const attributes = integration.attributes as Record<
					string,
					any
				>;
				const baseUrl = attributes.baseUrl;
				const connector = new JiraConnector(
					integration.account.accessToken!,
					baseUrl
				);
				const data = await connector.getProjects();
				resources = data.resources;
				pagination = {
					page: data.page,
					limit: data.limit,
					total: data.total,
					totalPages: data.totalPages,
					hasMore: data.hasMore,
				};
			} else if (toolName === "canny") {
				const connector = new CannyConnector(
					integration.account.accessToken!
				);

				const result = await connector.getBoards({
					page,
					limit,
					search,
				});

				resources = result.resources;
				pagination = {
					page: result.page,
					limit: result.limit,
					total: result.total,
					totalPages: result.totalPages,
					hasMore: result.hasMore,
				};
			} else {
				// Fallback for unsupported tools
				return NextResponse.json(
					{ error: `Integration ${toolName} not supported` },
					{ status: 400 }
				);
			}

			return NextResponse.json({ resources, pagination });
		} catch (error) {
			console.error(`[FETCH_${toolName.toUpperCase()}_RESOURCES]`, error);
			return NextResponse.json(
				{
					error: `Failed to fetch ${toolName} resources`,
					details:
						error instanceof Error
							? error.message
							: "Unknown error",
				},
				{ status: 500 }
			);
		}
	});
}
