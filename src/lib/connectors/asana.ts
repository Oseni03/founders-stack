/* eslint-disable @typescript-eslint/no-explicit-any */
import { getIntegration } from "@/server/integrations";
import { PaginatedResponse, PaginationOptions } from "@/types/connector";
import { prisma } from "../prisma";
import { Project } from "@prisma/client";

export interface ProjectData {
	externalId: string;
	name: string;
	description: string;
	attributes: Record<string, any>;
}

export interface TaskData {
	externalId: string;
	title: string;
	description: string;
	status: "open" | "in_progress" | "done";
	assignee: string | null;
	assigneeId: string | null;
	priority: "low" | "medium" | "high" | "urgent" | null;
	url: string | null;
	dueDate: string | null;
	labels: string[];
	attributes: Record<string, any>;
}

export class AsanaConnector {
	private accessToken: string;
	private refreshTokenValue: string | null;
	private organizationId: string | null;
	private baseUrl: string = "https://app.asana.com/api/1.0";
	private oauthUrl: string = "https://app.asana.com/-/oauth_token";

	constructor(
		accessToken: string,
		refreshToken: string | null,
		organizationId: string | null
	) {
		this.accessToken = accessToken;
		this.refreshTokenValue = refreshToken;
		this.organizationId = organizationId;
	}

	private async refreshToken(): Promise<{
		accessToken: string;
		refreshToken: string;
	}> {
		try {
			if (!this.refreshTokenValue || !this.organizationId) {
				throw new Error("Missing refresh token or organization ID");
			}

			const response = await fetch(this.oauthUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
				},
				body: new URLSearchParams({
					grant_type: "refresh_token",
					client_id: process.env.ASANA_CLIENT_ID || "",
					client_secret: process.env.ASANA_CLIENT_SECRET || "",
					refresh_token: this.refreshTokenValue,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Token refresh failed: ${response.status} - ${errorData.message || "Unknown error"}`
				);
			}

			const data = await response.json();
			const newAccessToken = data.access_token;
			const newRefreshToken =
				data.refresh_token || this.refreshTokenValue; // Asana may not return a new refresh token

			// Update UserIntegration
			const integration = await getIntegration(
				this.organizationId,
				"asana"
			);

			await prisma.account.update({
				where: { id: integration?.account.id },
				data: {
					accessToken: newAccessToken,
					refreshToken: newRefreshToken,
				},
			});

			this.accessToken = newAccessToken;
			this.refreshTokenValue = newRefreshToken;

			return {
				accessToken: newAccessToken,
				refreshToken: newRefreshToken,
			};
		} catch (error) {
			throw new Error(
				`Failed to refresh Asana token: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	private async apiRequest(
		endpoint: string,
		params: Record<string, any> = {},
		retryCount: number = 0
	): Promise<any> {
		const url = new URL(`${this.baseUrl}/${endpoint}`);
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				url.searchParams.append(key, value.toString());
			}
		});

		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				Accept: "application/json",
			},
		});

		if (response.status === 401 && retryCount < 1) {
			const errorData = await response.json().catch(() => ({}));
			if (
				errorData.errors?.some(
					(e: any) => e.message === "Not Authorized"
				)
			) {
				try {
					await this.refreshToken();
					return this.apiRequest(endpoint, params, retryCount + 1);
				} catch (refreshError) {
					throw refreshError;
				}
			}
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Asana API error: ${response.status} - ${errorData.message || "Unknown error"}`
			);
		}

		return response.json();
	}

	async fetchProjects(
		params: PaginationOptions
	): Promise<PaginatedResponse<ProjectData>> {
		try {
			const { page = 1, limit = 50, search = "" } = params;

			const apiParams: Record<string, any> = {
				limit,
				opt_fields: [
					"gid",
					"name",
					"notes",
					"archived",
					"public",
					"owner.gid",
					"workspace.gid",
					"team.gid",
					"due_on",
					"start_on",
					"default_view",
				].join(","),
			};

			const response = await this.apiRequest("projects", apiParams);

			let projects: any[] = response.data || [];

			if (search) {
				projects = projects.filter((project: any) =>
					project.name.toLowerCase().includes(search.toLowerCase())
				);
			}

			const mappedProjects: ProjectData[] = projects.map(
				(project: any) => ({
					externalId: project.gid,
					name: project.name,
					description: project.notes || "",
					attributes: {
						archived: project.archived,
						public: project.public,
						ownerGid: project.owner?.gid,
						workspaceGid: project.workspace?.gid,
						teamGid: project.team?.gid,
						dueOn: project.due_on,
						startOn: project.start_on,
						defaultView: project.default_view,
					},
				})
			);

			const total = projects.length; // Asana doesn't provide total_count for projects; approximate
			const totalPages = Math.ceil(total / limit);
			const hasMore = !!response.next_page || projects.length === limit;

			return {
				resources: mappedProjects,
				page,
				limit,
				total,
				totalPages,
				hasMore,
			};
		} catch (error) {
			console.error("[ASANA_FETCH_PROJECTS_ERROR]", error);
			throw new Error(
				`Failed to fetch Asana projects: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	async fetchTasks(
		projectGid: string,
		params: PaginationOptions
	): Promise<PaginatedResponse<TaskData>> {
		try {
			const { page = 1, limit = 50 } = params;
			const offset =
				page > 1 ? ((page - 1) * limit).toString() : undefined;

			const apiParams: Record<string, any> = {
				limit,
				offset,
				opt_fields: [
					"gid",
					"name",
					"notes",
					"assignee_status",
					"completed",
					"due_on",
					"due_at",
					"permalink_url",
					"assignee",
					"assignee.gid",
					"assignee.name",
					"tags",
					"tags.name",
					"custom_fields",
					"custom_fields.name",
					"custom_fields.enum_value",
					"custom_fields.enum_value.name",
					"memberships",
					"memberships.section",
					"memberships.section.gid",
					"memberships.section.name",
				].join(","),
			};

			const response = await this.apiRequest(
				`projects/${projectGid}/tasks`,
				apiParams
			);

			const tasks: any[] = response.data || [];

			const mappedTasks: TaskData[] = tasks.map((task: any) => {
				const priorityField = task.custom_fields?.find(
					(field: any) => field.name.toLowerCase() === "priority"
				);
				const priority =
					(priorityField?.enum_value?.name?.toLowerCase() as
						| "low"
						| "medium"
						| "high"
						| "urgent"
						| undefined) || null;

				return {
					externalId: task.gid,
					title: task.name,
					description: task.notes || "",
					status: task.completed
						? "done"
						: task.assignee_status === "inbox" ||
							  task.assignee_status === "new"
							? "open"
							: "in_progress",
					assignee: task.assignee?.name || null,
					assigneeId: task.assignee?.gid || null,
					priority,
					url: task.permalink_url || null,
					dueDate: task.due_at || task.due_on || null,
					labels: task.tags?.map((tag: any) => tag.name) || [],
					attributes: {
						listId: task.memberships?.[0]?.section?.gid || null,
						pos: task.memberships?.[0]?.section?.pos || 0,
						desc: task.notes || "",
					},
				};
			});

			const total = tasks.length; // Approximate
			const totalPages = Math.ceil(total / limit);
			const hasMore = !!response.next_page || tasks.length === limit;

			return {
				resources: mappedTasks,
				page,
				limit,
				total,
				totalPages,
				hasMore,
			};
		} catch (error) {
			console.error("[ASANA_FETCH_TASKS_ERROR]", error);
			throw new Error(
				`Failed to fetch Asana tasks: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}
}

export async function syncAsana(organizationId: string, projs: Project[] = []) {
	const integration = await getIntegration(organizationId, "asana");
	if (!integration?.account.accessToken) {
		throw new Error("Integration not connected");
	}

	let projects;

	if (projs.length === 0) {
		projects = await prisma.project.findMany({
			where: { organizationId, sourceTool: "asana" },
		});
	} else {
		projects = projs;
	}

	if (projects.length === 0) return;

	const connector = new AsanaConnector(
		integration.account.accessToken,
		integration.account.refreshToken,
		organizationId
	);

	const syncPromises = projects.map((project) => async () => {
		try {
			const { resources: tasks } = await connector.fetchTasks(
				project.externalId!,
				{
					page: 1,
					limit: 50,
				}
			);

			await prisma.task.createMany({
				data: tasks.map((task) => ({
					...task,
					organizationId,
					projectId: project.id,
					sourceTool: "asana",
				})),
			});
		} catch (error) {
			console.error(
				`❌ Sync failed for Asana project - ${project.name}:`,
				error
			);
		}
	});

	// Execute syncs with a concurrency limit (e.g., 5 concurrent syncs to respect GitHub API limits)
	const concurrencyLimit = 5;
	for (let i = 0; i < syncPromises.length; i += concurrencyLimit) {
		const batch = syncPromises.slice(i, i + concurrencyLimit);
		await Promise.all(batch.map((fn) => fn()));
	}

	console.log(`✅ Asana sync completed for organization: ${organizationId}`);
}
