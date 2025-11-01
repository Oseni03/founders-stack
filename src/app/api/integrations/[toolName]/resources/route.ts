/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/server/integrations";
import { withAuth } from "@/lib/middleware";
import { GitHubConnector } from "@/lib/connectors/github";
import { AsanaConnector } from "@/lib/connectors/asana";
import { SlackConnector } from "@/lib/connectors/slack";
import { JiraConnector } from "@/lib/connectors/jira";
import { CannyConnector } from "@/lib/connectors/canny";
import { PaginatedResponse, Resources } from "@/types/connector";
import { z } from "zod";

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

type QueryParams = z.infer<typeof querySchema>;

interface Integration {
	accessToken: string | null;
	apiKey: string | null;
	metadata: any;
	attributes: any;
}

// Tool configuration
const TOOL_CONFIG = {
	github: {
		authField: "accessToken" as const,
		fetchResources: async (
			integration: Integration,
			params: QueryParams
		) => {
			const connector = new GitHubConnector(integration.accessToken!);
			return await connector.fetchRepositories(params);
		},
	},
	asana: {
		authField: "apiKey" as const,
		fetchResources: async (
			integration: Integration,
			params: QueryParams
		) => {
			const connector = new AsanaConnector(integration.apiKey!);
			const workspaceGid = (integration.metadata as Record<string, any>)
				.workspaceGid;
			return await connector.fetchProjects(workspaceGid, params);
		},
	},
	slack: {
		authField: "accessToken" as const,
		fetchResources: async (
			integration: Integration,
			params: QueryParams
		) => {
			const connector = new SlackConnector(integration.accessToken!);
			return await connector.fetchChannels(params);
		},
	},
	jira: {
		authField: "accessToken" as const,
		fetchResources: async (
			integration: Integration,
			params: QueryParams
		) => {
			const attributes = integration.attributes as Record<string, any>;
			const connector = new JiraConnector(
				integration.accessToken!,
				attributes.cloudId
			);
			return await connector.getProjects(params);
		},
	},
	canny: {
		authField: "apiKey" as const,
		fetchResources: async (
			integration: Integration,
			params: QueryParams
		) => {
			const connector = new CannyConnector(integration.apiKey!);
			return await connector.getBoards(params);
		},
	},
} as const;

type ToolName = keyof typeof TOOL_CONFIG;

function isToolSupported(toolName: string): toolName is ToolName {
	return toolName in TOOL_CONFIG;
}

function capitalizeToolName(toolName: string): string {
	return toolName.charAt(0).toUpperCase() + toolName.slice(1);
}

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

		const queryParams = parsedParams.data;

		try {
			// Check if tool is supported
			if (!isToolSupported(toolName)) {
				return NextResponse.json(
					{ error: `Integration ${toolName} not supported` },
					{ status: 400 }
				);
			}

			const config = TOOL_CONFIG[toolName];

			// Fetch integration
			const integration = await getIntegration(
				user.organizationId,
				toolName
			);

			if (!integration?.[config.authField]) {
				return NextResponse.json(
					{ error: `${capitalizeToolName(toolName)} not connected` },
					{ status: 404 }
				);
			}

			// Fetch resources using tool-specific handler
			const result: PaginatedResponse<Resources> =
				await config.fetchResources(integration, queryParams);

			return NextResponse.json({
				resources: result.resources,
				pagination: {
					page: result.page,
					limit: result.limit,
					total: result.total,
					totalPages: result.totalPages,
					hasMore: result.hasMore,
				},
			});
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
