import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { z } from "zod";
import { saveRepositories } from "@/server/code";
import { RepoData } from "@/types/code";
import { saveProjects } from "@/server/tasks";
import { saveChannels } from "@/server/messages";
import { ChannelData } from "@/lib/connectors/slack";
import { ProjectData } from "@/types/connector";

const ResourcesSchema = z.array(
	z
		.object({
			externalId: z.string(),
			name: z.string(),
		})
		// allow any other key/value pairs (values can be any)
		.catchall(z.any())
);

// Input validation schema for request body
const requestSchema = z.object({
	selected: ResourcesSchema,
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { toolName } = await params;
		try {
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

			if (toolName === "github") {
				const repoSchema = z.array(
					z.object({
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
					})
				);

				try {
					repoSchema.parse(selected);
				} catch (validationError) {
					console.error("[REPO_VALIDATION]", validationError);
					return NextResponse.json(
						{
							error: "Invalid request data",
							details: validationError,
						},
						{ status: 400 }
					);
				}

				await saveRepositories(
					user.organizationId,
					selected as RepoData[]
				);
			} else if (toolName === "asana") {
				const projectSchema = z.array(
					z.object({
						externalId: z.string().min(1),
						name: z.string().min(1),
						description: z.string().nullable(),
						attributes: z.any(),
					})
				);

				try {
					projectSchema.parse(selected);
				} catch (validationError) {
					console.error("[PM_VALIDATION]", validationError);
					return NextResponse.json(
						{
							error: "Invalid request data",
							details: validationError,
						},
						{ status: 400 }
					);
				}

				await saveProjects(
					user.organizationId,
					toolName,
					selected as ProjectData[]
				);
			} else if (toolName === "slack") {
				const channelSchema = z.array(
					z.object({
						externalId: z.string().min(1),
						name: z.string().min(1),
						description: z.string().nullable(),
						attributes: z.any(),
					})
				);

				try {
					channelSchema.parse(selected);
				} catch (validationError) {
					console.error("[SLACK_VALIDATION]", validationError);
					return NextResponse.json(
						{
							error: "Invalid request data",
							details: validationError,
						},
						{ status: 400 }
					);
				}

				await saveChannels(
					user.organizationId,
					selected as ChannelData[]
				);
			} else if (toolName === "jira") {
				const projectSchema = z.array(
					z.object({
						externalId: z.string().min(1),
						name: z.string().min(1),
						Description: z.string().nullable(),
					})
				);

				try {
					projectSchema.parse(selected);
				} catch (validationError) {
					console.error("[JIRA_VALIDATION]", validationError);
					return NextResponse.json(
						{
							error: "Invalid request data",
							details: validationError,
						},
						{ status: 400 }
					);
				}

				await saveProjects(
					user.organizationId,
					"jira",
					selected as ProjectData[]
				);
			}

			return NextResponse.json({
				success: true,
				addedCount: selected.length,
			});
		} catch (error) {
			console.error("[SAVE_GITHUB_RESOURCES]", error);
			return NextResponse.json(
				{
					error: "Failed to save GitHub repositories",
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
