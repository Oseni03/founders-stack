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

export function mapIssueToTaskData(issue: any): IssueData {
	const statusName = issue.fields.status?.name?.toLowerCase() || "open";
	const priorityName = issue.fields.priority?.name?.toLowerCase();

	return {
		externalId: issue.id,
		title: issue.fields.summary,
		description: extractDescription(issue.fields.description),
		status: normalizeStatus(statusName),
		priority: normalizePriority(priorityName),
		assignee: issue.fields.assignee?.displayName,
		assigneeId: issue.fields.assignee?.accountId,
		url: `${issue.self.split("/rest/api")[0]}/browse/${issue.key}`,
		dueDate: issue.fields.duedate
			? new Date(issue.fields.duedate)
			: undefined,
		createdAt: new Date(issue.fields.created),
		updatedAt: new Date(issue.fields.updated),
		labels: issue.fields.labels || [],
		attributes: {
			issueKey: issue.key,
			issueType: issue.fields.issuetype?.name,
			issueTypeId: issue.fields.issuetype?.id,
			jiraPriority: issue.fields.priority?.name,
			jiraPriorityId: issue.fields.priority?.id,
			jiraStatus: issue.fields.status?.name,
			jiraStatusId: issue.fields.status?.id,
			projectKey: issue.fields.project?.key,
			projectName: issue.fields.project?.name,
			assignee: issue.fields.assignee
				? {
						accountId: issue.fields.assignee.accountId,
						displayName: issue.fields.assignee.displayName,
						email: issue.fields.assignee.emailAddress,
					}
				: null,
			created: issue.fields.created,
			commentCount: issue.fields.comment?.total || 0,
			reporter: issue.fields.reporter?.displayName,
			reporterId: issue.fields.reporter?.accountId,
			statusCategory: issue.fields.status?.statusCategory?.key,
		},
	};
}

export function extractDescription(description: any): string | undefined {
	if (!description) return undefined;

	if (typeof description === "object" && description.content) {
		return adfToText(description);
	}

	return String(description);
}

export function adfToText(adf: any): string {
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

export function normalizeStatus(status: string): TaskStatus {
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

export function normalizePriority(priority?: string): TaskPriority | undefined {
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

export function denormalizePriority(priority: TaskPriority): string {
	const priorityMap: Record<TaskPriority, string> = {
		high: "High",
		medium: "Medium",
		low: "Low",
		urgent: "Urgent",
	};

	return priorityMap[priority] || "Medium";
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

	/**
	 * Create a new project
	 */
	async createProject(project: {
		name: string;
		key: string;
		description?: string;
		leadAccountId?: string;
		projectTypeKey?: "software" | "service_desk" | "business";
	}): Promise<ProjectData> {
		try {
			const response = await fetch(`${this.baseUrl}/rest/api/3/project`, {
				method: "POST",
				headers: {
					...this.getHeaders(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: project.name,
					key: project.key,
					description: project.description || "",
					leadAccountId: project.leadAccountId,
					projectTypeKey: project.projectTypeKey || "software",
					assigneeType: "UNASSIGNED",
				}),
			});

			await this.handleResponse(response);
			const createdProject = await response.json();

			return {
				externalId: createdProject.id,
				name: createdProject.name,
				description: createdProject.description || "",
				attributes: {
					key: createdProject.key,
					projectTypeKey: createdProject.projectTypeKey,
					lead: createdProject.lead?.displayName,
					avatarUrls: createdProject.avatarUrls,
				},
			};
		} catch (error) {
			console.error("[JIRA_CREATE_PROJECT_ERROR]", error);
			throw new Error(
				`Failed to create Jira project: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Update an existing project
	 */
	async updateProject(
		projectIdOrKey: string,
		updates: {
			name?: string;
			description?: string;
			leadAccountId?: string;
		}
	): Promise<ProjectData> {
		try {
			const response = await fetch(
				`${this.baseUrl}/rest/api/3/project/${projectIdOrKey}`,
				{
					method: "PUT",
					headers: {
						...this.getHeaders(),
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: updates.name,
						description: updates.description,
						leadAccountId: updates.leadAccountId,
					}),
				}
			);

			await this.handleResponse(response);
			const updatedProject = await response.json();

			return {
				externalId: updatedProject.id,
				name: updatedProject.name,
				description: updatedProject.description || "",
				attributes: {
					key: updatedProject.key,
					projectTypeKey: updatedProject.projectTypeKey,
					lead: updatedProject.lead?.displayName,
					avatarUrls: updatedProject.avatarUrls,
				},
			};
		} catch (error) {
			console.error("[JIRA_UPDATE_PROJECT_ERROR]", error);
			throw new Error(
				`Failed to update Jira project: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Delete a project
	 */
	async deleteProject(projectIdOrKey: string): Promise<void> {
		try {
			const response = await fetch(
				`${this.baseUrl}/rest/api/3/project/${projectIdOrKey}`,
				{
					method: "DELETE",
					headers: this.getHeaders(),
				}
			);

			await this.handleResponse(response);
		} catch (error) {
			console.error("[JIRA_DELETE_PROJECT_ERROR]", error);
			throw new Error(
				`Failed to delete Jira project: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	async getProjects(
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<ProjectData>> {
		try {
			const { page = 1, limit = 50 } = options;

			// Convert page number to startAt offset (page 1 = startAt 0)
			const startAt = (page - 1) * limit;

			const response = await fetch(
				`${this.baseUrl}/rest/api/3/project/search?startAt=${startAt}&maxResults=${limit}&expand=description,lead`,
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
				page: page, // Return the page number that was requested
				limit,
				hasMore: !data.isLast, // Use Jira's isLast field
			};
		} catch (error) {
			console.error("[JIRA_FETCH_PROJECTS_ERROR]", error);
			throw new Error(
				`Failed to fetch Jira projects: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	// ========================================================================
	// ISSUE METHODS
	// ========================================================================

	/**
	 * Create a new issue
	 */
	async createIssue(
		projectIdOrKey: string,
		issue: {
			title: string;
			description?: string;
			assigneeId?: string;
			dueDate?: Date;
			priority?: TaskPriority;
			labels?: string[];
		}
	): Promise<IssueData> {
		try {
			const response = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
				method: "POST",
				headers: {
					...this.getHeaders(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					fields: {
						project: { id: projectIdOrKey },
						summary: issue.title,
						description: issue.description
							? {
									type: "doc",
									version: 1,
									content: [
										{
											type: "paragraph",
											content: [
												{
													type: "text",
													text: issue.description,
												},
											],
										},
									],
								}
							: undefined,
						issuetype: { name: "Task" },
						assignee: issue.assigneeId
							? { accountId: issue.assigneeId }
							: null,
						duedate: issue.dueDate
							? issue.dueDate.toISOString().split("T")[0]
							: undefined,
						priority: issue.priority
							? { name: denormalizePriority(issue.priority) }
							: undefined,
						labels: issue.labels || [],
					},
				}),
			});

			await this.handleResponse(response);
			const createdIssue = await response.json();

			// Fetch the full issue to get all fields
			return await this.getIssue(createdIssue.key);
		} catch (error) {
			console.error("[JIRA_CREATE_ISSUE_ERROR]", error);
			throw new Error(
				`Failed to create Jira issue: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Update an existing issue
	 */
	async updateIssue(
		issueIdOrKey: string,
		updates: {
			title?: string;
			description?: string;
			assigneeId?: string | null;
			dueDate?: Date | null;
			priority?: TaskPriority | null;
			labels?: string[];
			status?: TaskStatus;
		}
	): Promise<IssueData> {
		try {
			const updatePayload: any = {
				fields: {
					summary: updates.title,
					description:
						updates.description !== undefined
							? {
									type: "doc",
									version: 1,
									content: [
										{
											type: "paragraph",
											content: [
												{
													type: "text",
													text:
														updates.description ||
														"",
												},
											],
										},
									],
								}
							: undefined,
					assignee: updates.assigneeId
						? { accountId: updates.assigneeId }
						: updates.assigneeId === null
							? null
							: undefined,
					duedate: updates.dueDate
						? updates.dueDate.toISOString().split("T")[0]
						: updates.dueDate === null
							? null
							: undefined,
					priority: updates.priority
						? { name: denormalizePriority(updates.priority) }
						: undefined,
					labels: updates.labels,
				},
			};

			// Handle status transition if provided
			let transitionResponse: any = null;
			if (updates.status) {
				const transitions =
					await this.getIssueTransitions(issueIdOrKey);
				const targetTransition = transitions.find(
					(t: any) => normalizeStatus(t.to.name) === updates.status
				);
				if (targetTransition) {
					const transitionResp = await fetch(
						`${this.baseUrl}/rest/api/3/issue/${issueIdOrKey}/transitions`,
						{
							method: "POST",
							headers: {
								...this.getHeaders(),
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								transition: { id: targetTransition.id },
							}),
						}
					);
					await this.handleResponse(transitionResp);
					transitionResponse = await transitionResp.json();
				}
			}

			const response = await fetch(
				`${this.baseUrl}/rest/api/3/issue/${issueIdOrKey}`,
				{
					method: "PUT",
					headers: {
						...this.getHeaders(),
						"Content-Type": "application/json",
					},
					body: JSON.stringify(updatePayload),
				}
			);

			await this.handleResponse(response);

			// Fetch the updated issue to ensure all fields are returned
			return await this.getIssue(issueIdOrKey);
		} catch (error) {
			console.error("[JIRA_UPDATE_ISSUE_ERROR]", error);
			throw new Error(
				`Failed to update Jira issue: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Delete an issue
	 */
	async deleteIssue(issueIdOrKey: string): Promise<void> {
		try {
			const response = await fetch(
				`${this.baseUrl}/rest/api/3/issue/${issueIdOrKey}`,
				{
					method: "DELETE",
					headers: this.getHeaders(),
				}
			);

			await this.handleResponse(response);
		} catch (error) {
			console.error("[JIRA_DELETE_ISSUE_ERROR]", error);
			throw new Error(
				`Failed to delete Jira issue: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

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
				mapIssueToTaskData(issue)
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
			console.error("[JIRA_FETCH_ISSUES_ERROR]", error);
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

			return mapIssueToTaskData(issue);
		} catch (error) {
			console.error("[JIRA_GET_ISSUE_ERROR]", error);
			throw new Error(`Failed to fetch Jira issue: ${issueIdOrKey}`);
		}
	}

	// ========================================================================
	// WEBHOOK METHODS
	// ========================================================================

	/**
	 * Create a webhook programmatically
	 */
	async createWebhook(
		webhookUrl: string,
		events: string[],
		projectKeys: string[]
	): Promise<any> {
		try {
			const jqlFilter =
				projectKeys.length > 0
					? `project IN (${projectKeys.join(", ")})`
					: undefined;

			const requestBody: any = {
				name: "Integration Webhook",
				url: webhookUrl,
				events,
				excludeBody: false,
			};

			if (jqlFilter) {
				requestBody.jqlFilter = jqlFilter;
			}

			const response = await fetch(`${this.baseUrl}/rest/api/3/webhook`, {
				method: "POST",
				headers: {
					...this.getHeaders(),
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
			});

			await this.handleResponse(response);
			const data = await response.json();

			return {
				webhookId: data.createdWebhookId,
				details: data,
			};
		} catch (error) {
			console.error("[JIRA_CREATE_WEBHOOK_ERROR]", error);
			throw new Error(
				`Failed to create Jira webhook: ${error instanceof Error ? error.message : "Unknown error"}`
			);
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
			console.error("[JIRA_LIST_WEBHOOKS_ERROR]", error);
			throw new Error(
				`Failed to list Jira webhooks: ${error instanceof Error ? error.message : "Unknown error"}`
			);
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
			console.error("[JIRA_DELETE_WEBHOOK_ERROR]", error);
			throw new Error(
				`Failed to delete Jira webhook: ${error instanceof Error ? error.message : "Unknown error"}`
			);
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
			console.error("[JIRA_REFRESH_WEBHOOK_ERROR]", error);
			throw new Error(
				`Failed to refresh Jira webhook: ${error instanceof Error ? error.message : "Unknown error"}`
			);
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

	private async getIssueTransitions(issueIdOrKey: string): Promise<any[]> {
		try {
			const response = await fetch(
				`${this.baseUrl}/rest/api/3/issue/${issueIdOrKey}/transitions`,
				{
					headers: this.getHeaders(),
				}
			);

			await this.handleResponse(response);
			const data = await response.json();
			return data.transitions || [];
		} catch (error) {
			console.error("[JIRA_GET_TRANSITIONS_ERROR]", error);
			throw new Error(
				`Failed to fetch transitions for Jira issue: ${issueIdOrKey}`
			);
		}
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
			console.error("[JIRA_TEST_CONNECTION_ERROR]", error);
			return false;
		}
	}
}
