/* eslint-disable @typescript-eslint/no-explicit-any */
import { getIntegration } from "@/server/integrations";
import { prisma } from "../prisma";
import { Project, TaskPriority, TaskStatus } from "@prisma/client";
import {
	PaginatedResponse,
	PaginationOptions,
	ProjectData,
} from "@/types/connector";

interface IssueData {
	externalId: string;
	title: string;
	description?: string;
	status: TaskStatus;
	priority?: TaskPriority;
	assignee?: string;
	assigneeId?: string;
	url?: string;
	dueDate?: Date;
	createdAt: Date;
	updatedAt: Date;
	attributes: Record<string, any>;
}

export class JiraConnector {
	private baseUrl: string;
	private apiKey: string;

	constructor(apiKey: string, baseUrl: string) {
		this.apiKey = apiKey;
		this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
	}

	// ========================================================================
	// PROJECT METHODS
	// ========================================================================

	async getProjects(
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<ProjectData>> {
		try {
			const { page = 0, limit = 50 } = options;

			const response = await fetch(
				`${this.baseUrl}/rest/api/3/project/search?startAt=${page}&maxResults=${limit}&expand=description`,
				{
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						Accept: "application/json",
					},
				}
			);

			await this.handleResponse(response);

			const data = await response.json();

			const projects: ProjectData[] = data.values.map((item: any) => ({
				externalId: item.id,
				name: item.name,
				description: item.description || "",
			}));

			return {
				resources: projects,
				total: data.total,
				totalPages: Math.ceil(data.total / data.maxResults),
				page: data.startAt,
				limit: data.maxResults,
				hasMore: data.startAt + data.maxResults < data.total,
			};
		} catch (error) {
			console.error("Jira projects fetching failed:", error);
			throw new Error("Failed to fetch Jira projects");
		}
	}

	// ========================================================================
	// ISSUE METHODS
	// ========================================================================

	/**
	 * Get issues for a project with pagination
	 * @param projectIdOrKey - Project ID or Key
	 * @param options - Pagination and filter options
	 */
	async getIssues(
		projectIdOrKey: string,
		options: PaginationOptions
	): Promise<PaginatedResponse<IssueData>> {
		try {
			const { page = 1, limit = 50 } = options;

			// Build JQL query
			const jqlQuery = `project=${projectIdOrKey}`;

			const response = await fetch(
				`${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(
					jqlQuery
				)}&startAt=${page}&maxResults=${limit}&fields=summary,description,status,priority,assignee,reporter,created,updated,project`,
				{
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						Accept: "application/json",
					},
				}
			);

			await this.handleResponse(response);

			const data = await response.json();

			const issues: IssueData[] = data.issues.map((issue: any) => ({
				externalId: issue.id,
				title: issue.fields.summary,
				description: issue.fields.description || undefined,
				status: (issue.fields.status?.name as string).toLowerCase(),
				priority: (issue.fields.priority?.name as string).toLowerCase(),
				assignee: issue.fields.assignee?.displayName,
				assigneeId: issue.fields.assignee?.id,
				createdAt: new Date(issue.fields.created),
				updatedAt: new Date(issue.fields.updated),
			}));

			return {
				resources: issues,
				total: data.total,
				totalPages: Math.ceil(data.total / data.maxResults),
				page: data.startAt,
				limit: data.maxResults,
				hasMore: data.startAt + data.maxResults >= data.total,
			};
		} catch (error) {
			console.error("Jira issues fetching failed:", error);
			throw new Error(
				`Failed to fetch Jira issues for project: ${projectIdOrKey}`
			);
		}
	}

	// ========================================================================
	// UTILITY METHODS
	// ========================================================================

	/**
	 * Handle API response errors
	 */
	private async handleResponse(response: Response): Promise<void> {
		if (response.status === 401) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Jira authentication failed: ${
					errorData.errorMessages?.[0] || "Invalid API key"
				}`
			);
		}

		if (response.status === 403) {
			throw new Error(
				"Jira authorization failed: Insufficient permissions"
			);
		}

		if (response.status === 404) {
			throw new Error("Jira resource not found");
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Jira API error: ${response.status} - ${
					errorData.errorMessages?.[0] || response.statusText
				}`
			);
		}
	}

	/**
	 * Test the connection to Jira
	 */
	async testConnection(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/rest/api/3/myself`, {
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					Accept: "application/json",
				},
			});

			return response.ok;
		} catch (error) {
			console.error("Jira connection test failed:", error);
			return false;
		}
	}
}

export async function syncJira(organizationId: string, projs: Project[] = []) {
	const integration = await getIntegration(organizationId, "jira");
	if (!integration?.account.apiKey) {
		throw new Error("Integration not connected");
	}

	// Validate attributes and baseUrl exist
	if (!integration.attributes || typeof integration.attributes !== "object") {
		throw new Error("Integration attributes not found");
	}

	const attributes = integration.attributes as Record<string, any>;
	const baseUrl = attributes.baseUrl;

	if (!baseUrl || typeof baseUrl !== "string") {
		throw new Error("Jira base URL not configured");
	}

	let projects;

	if (projs.length === 0) {
		projects = await prisma.project.findMany({
			where: { organizationId, sourceTool: "jira" },
		});
	} else {
		projects = projs;
	}

	if (projects.length === 0) return;

	const connector = new JiraConnector(integration.account.apiKey, baseUrl);

	const syncPromises = projects.map((project) => async () => {
		try {
			const { resources: tasks } = await connector.getIssues(
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
					sourceTool: "jira",
				})),
				skipDuplicates: true,
			});
		} catch (error) {
			console.error(
				`❌ Sync failed for Jira project - ${project.name}:`,
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

	console.log(`✅ Jira sync completed for organization: ${organizationId}`);
}
