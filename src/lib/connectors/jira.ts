/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	PaginatedResponse,
	PaginationOptions,
	ProjectData,
} from "@/types/connector";
import { TaskPriority, TaskStatus } from "@prisma/client";

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
	labels?: string[];
	attributes: Record<string, any>;
}

export class JiraConnector {
	private baseUrl: string;
	private accessToken: string;

	constructor(accessToken: string, cloudId: string) {
		this.accessToken = accessToken;
		this.baseUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
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
				`${this.baseUrl}/rest/api/3/project/search?startAt=${page}&maxResults=${limit}&expand=description,lead`,
				{
					headers: this.getHeaders(),
				}
			);

			await this.handleResponse(response);
			const data = await response.json();

			const projects: ProjectData[] = data.values.map((item: any) => ({
				externalId: item.id,
				name: item.name,
				description: item.description || "",
				attributes: {
					key: item.key,
					projectTypeKey: item.projectTypeKey,
					lead: item.lead?.displayName,
					avatarUrls: item.avatarUrls,
				},
			}));

			return {
				resources: projects,
				total: data.total,
				totalPages: Math.ceil(data.total / limit),
				page: Math.floor(page / limit),
				limit,
				hasMore: page + limit < data.total,
			};
		} catch (error) {
			console.error("Jira projects fetching failed:", error);
			throw new Error("Failed to fetch Jira projects");
		}
	}

	// ========================================================================
	// ISSUE METHODS
	// ========================================================================

	async getIssues(
		projectIdOrKey: string,
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<IssueData>> {
		try {
			const { page = 0, limit = 50 } = options;
			const jqlQuery = `project=${projectIdOrKey} ORDER BY updated DESC`;

			const response = await fetch(
				`${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jqlQuery)}&startAt=${page}&maxResults=${limit}&fields=summary,description,status,priority,assignee,reporter,created,updated,duedate,labels,issuetype`,
				{
					headers: this.getHeaders(),
				}
			);

			await this.handleResponse(response);
			const data = await response.json();

			const issues: IssueData[] = data.issues.map((issue: any) =>
				this.mapIssueToTaskData(issue)
			);

			return {
				resources: issues,
				total: data.total,
				totalPages: Math.ceil(data.total / limit),
				page: Math.floor(page / limit),
				limit,
				hasMore: page + limit < data.total,
			};
		} catch (error) {
			console.error("Jira issues fetching failed:", error);
			throw new Error(
				`Failed to fetch Jira issues for project: ${projectIdOrKey}`
			);
		}
	}

	async getIssue(issueIdOrKey: string): Promise<IssueData> {
		try {
			const response = await fetch(
				`${this.baseUrl}/rest/api/3/issue/${issueIdOrKey}?fields=summary,description,status,priority,assignee,reporter,created,updated,duedate,labels,issuetype`,
				{
					headers: this.getHeaders(),
				}
			);

			await this.handleResponse(response);
			const issue = await response.json();

			return this.mapIssueToTaskData(issue);
		} catch (error) {
			console.error("Jira issue fetching failed:", error);
			throw new Error(`Failed to fetch Jira issue: ${issueIdOrKey}`);
		}
	}

	// ========================================================================
	// WEBHOOK METHODS
	// ========================================================================

	/**
	 * Create a webhook programmatically
	 */
	async createWebhook(webhookUrl: string, events: string[]): Promise<any> {
		try {
			const response = await fetch(`${this.baseUrl}/rest/api/3/webhook`, {
				method: "POST",
				headers: {
					...this.getHeaders(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: "Integration Webhook",
					url: webhookUrl,
					events,
					excludeBody: false,
				}),
			});

			await this.handleResponse(response);
			const data = await response.json();

			return {
				webhookId: data.createdWebhookId,
				details: data,
			};
		} catch (error) {
			console.error("Failed to create Jira webhook:", error);
			throw new Error("Failed to create webhook");
		}
	}

	/**
	 * List all webhooks
	 */
	async listWebhooks(): Promise<any[]> {
		try {
			const response = await fetch(`${this.baseUrl}/rest/api/3/webhook`, {
				headers: this.getHeaders(),
			});

			await this.handleResponse(response);
			const data = await response.json();

			return data.values || [];
		} catch (error) {
			console.error("Failed to list Jira webhooks:", error);
			throw new Error("Failed to list webhooks");
		}
	}

	/**
	 * Delete a webhook
	 */
	async deleteWebhook(webhookId: number): Promise<void> {
		try {
			const response = await fetch(`${this.baseUrl}/rest/api/3/webhook`, {
				method: "DELETE",
				headers: {
					...this.getHeaders(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					webhookIds: [webhookId],
				}),
			});

			await this.handleResponse(response);
		} catch (error) {
			console.error("Failed to delete Jira webhook:", error);
			throw new Error("Failed to delete webhook");
		}
	}

	/**
	 * Refresh webhook expiration (extends by 30 days)
	 */
	async refreshWebhook(webhookIds: number[]): Promise<void> {
		try {
			const response = await fetch(
				`${this.baseUrl}/rest/api/3/webhook/refresh`,
				{
					method: "PUT",
					headers: {
						...this.getHeaders(),
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						webhookIds,
					}),
				}
			);

			await this.handleResponse(response);
		} catch (error) {
			console.error("Failed to refresh Jira webhook:", error);
			throw new Error("Failed to refresh webhook");
		}
	}

	// ========================================================================
	// UTILITY METHODS
	// ========================================================================

	private getHeaders() {
		return {
			Authorization: `Bearer ${this.accessToken}`,
			Accept: "application/json",
		};
	}

	private mapIssueToTaskData(issue: any): IssueData {
		const statusName = issue.fields.status?.name?.toLowerCase() || "open";
		const priorityName = issue.fields.priority?.name?.toLowerCase();

		return {
			externalId: issue.id,
			title: issue.fields.summary,
			description: this.extractDescription(issue.fields.description),
			status: this.normalizeStatus(statusName),
			priority: this.normalizePriority(priorityName),
			assignee: issue.fields.assignee?.displayName,
			assigneeId: issue.fields.assignee?.accountId,
			url: `${this.baseUrl}/browse/${issue.key}`,
			dueDate: issue.fields.duedate
				? new Date(issue.fields.duedate)
				: undefined,
			createdAt: new Date(issue.fields.created),
			updatedAt: new Date(issue.fields.updated),
			labels: issue.fields.labels || [],
			attributes: {
				key: issue.key,
				issueType: issue.fields.issuetype?.name,
				reporter: issue.fields.reporter?.displayName,
				reporterId: issue.fields.reporter?.accountId,
				statusCategory: issue.fields.status?.statusCategory?.key,
			},
		};
	}

	private extractDescription(description: any): string | undefined {
		if (!description) return undefined;

		// Jira uses Atlassian Document Format (ADF)
		if (typeof description === "object" && description.content) {
			return this.adfToText(description);
		}

		return String(description);
	}

	private adfToText(adf: any): string {
		if (!adf.content) return "";

		return adf.content
			.map((node: any) => {
				if (node.type === "paragraph" && node.content) {
					return node.content
						.map((item: any) => item.text || "")
						.join("");
				}
				return "";
			})
			.join("\n");
	}

	private normalizeStatus(status: string): TaskStatus {
		const statusMap: Record<string, TaskStatus> = {
			"to do": "open",
			todo: "open",
			open: "open",
			backlog: "open",
			"in progress": "in_progress",
			in_progress: "in_progress",
			"in review": "in_progress",
			review: "in_progress",
			done: "done",
			closed: "done",
			resolved: "done",
			completed: "done",
		};

		return statusMap[status] || "open";
	}

	private normalizePriority(priority?: string): TaskPriority | undefined {
		if (!priority) return undefined;

		const priorityMap: Record<string, TaskPriority> = {
			highest: "high",
			high: "high",
			medium: "medium",
			low: "low",
			lowest: "low",
		};

		return priorityMap[priority];
	}

	private async handleResponse(response: Response): Promise<void> {
		if (response.status === 401) {
			throw new Error(
				"Jira authentication failed: Token expired or invalid"
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

	async testConnection(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/rest/api/3/myself`, {
				headers: this.getHeaders(),
			});

			return response.ok;
		} catch (error) {
			console.error("Jira connection test failed:", error);
			return false;
		}
	}
}
