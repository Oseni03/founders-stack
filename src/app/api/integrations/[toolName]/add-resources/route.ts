/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { z } from "zod";
import { saveRepositories } from "@/server/categories/code";
import { RepoData } from "@/types/code";
import { saveProjects } from "@/server/categories/tasks";
import { ChannelData } from "@/lib/connectors/slack";
import { ProjectData } from "@/types/connector";

// Base resource schema
const BaseResourceSchema = z.object({
	externalId: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullable(),
	attributes: z.any(),
});

// GitHub-specific schema
const GitHubRepoSchema = z.object({
	externalId: z.string().min(1),
	name: z.string().min(1),
	fullName: z.string().min(1),
	owner: z.string().min(1),
	url: z.url(),
	description: z.string().nullable(),
	defaultBranch: z.string(),
	language: z.string().nullable(),
	isPrivate: z.boolean(),
	isArchived: z.boolean(),
	openIssuesCount: z.number().nonnegative(),
	forksCount: z.number().nonnegative(),
	stargazersCount: z.number().nonnegative(),
	attributes: z.record(z.string(), z.any()).optional(),
});

// Tool configuration
const TOOL_CONFIG = {
	github: {
		schema: z.array(GitHubRepoSchema),
		handler: async (orgId: string, data: any[]) =>
			saveRepositories(orgId, data as RepoData[]),
		validationLabel: "REPO_VALIDATION",
		errorMessage: "Failed to save GitHub repositories",
	},
	asana: {
		schema: z.array(BaseResourceSchema),
		handler: async (orgId: string, data: any[]) =>
			saveProjects(orgId, "asana", data as ProjectData[]),
		validationLabel: "PM_VALIDATION",
		errorMessage: "Failed to save Asana projects",
	},
	slack: {
		schema: z.array(BaseResourceSchema),
		handler: async (orgId: string, data: any[]) =>
			saveProjects(orgId, "slack", data as ChannelData[]),
		validationLabel: "SLACK_VALIDATION",
		errorMessage: "Failed to save Slack channels",
	},
	jira: {
		schema: z.array(BaseResourceSchema),
		handler: async (orgId: string, data: any[]) =>
			saveProjects(orgId, "jira", data as ProjectData[]),
		validationLabel: "JIRA_VALIDATION",
		errorMessage: "Failed to save Jira projects",
	},
	canny: {
		schema: z.array(BaseResourceSchema),
		handler: async (orgId: string, data: any[]) =>
			saveProjects(orgId, "canny", data as ProjectData[]),
		validationLabel: "CANNY_VALIDATION",
		errorMessage: "Failed to save Canny projects",
	},
} as const;

type ToolName = keyof typeof TOOL_CONFIG;

// Input validation schema for request body
const requestSchema = z.object({
	selected: z.array(
		z
			.object({
				externalId: z.string(),
				name: z.string(),
			})
			.catchall(z.any())
	),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;

		try {
			// Check if tool is supported
			if (!(toolName in TOOL_CONFIG)) {
				return NextResponse.json(
					{ error: `Unsupported tool: ${toolName}` },
					{ status: 400 }
				);
			}

			const config = TOOL_CONFIG[toolName as ToolName];

			// Parse and validate request body
			const body = await request.json();
			const parsedBody = requestSchema.safeParse(body);

			if (!parsedBody.success) {
				console.error("Invalid resources data: ", parsedBody.error);
				return NextResponse.json(
					{
						error: "Invalid request data",
						details: parsedBody.error,
					},
					{ status: 400 }
				);
			}

			const { selected } = parsedBody.data;

			// Validate tool-specific schema
			try {
				config.schema.parse(selected);
			} catch (validationError) {
				console.error(`[${config.validationLabel}]`, validationError);
				return NextResponse.json(
					{
						error: "Invalid request data",
						details: validationError,
					},
					{ status: 400 }
				);
			}

			// Execute tool-specific handler
			await config.handler(user.organizationId, selected);

			return NextResponse.json({
				success: true,
				addedCount: selected.length,
			});
		} catch (error) {
			const config = TOOL_CONFIG[toolName as ToolName];
			const errorMessage =
				config?.errorMessage || "Failed to save resources";

			console.error(`[SAVE_${toolName.toUpperCase()}_RESOURCES]`, error);
			return NextResponse.json(
				{
					error: errorMessage,
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
