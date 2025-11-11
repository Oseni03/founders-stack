/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	PaginatedResponse,
	PaginationOptions,
	ProjectData,
} from "@/types/connector";

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

export const mapProject = (project: any) => ({
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
});

export const mapTask = (task: any): TaskData => {
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
			: task.assignee_status === "inbox" || task.assignee_status === "new"
				? "open"
				: "in_progress",
		assignee: task.assignee?.name || null,
		assigneeId: task.assignee?.gid || null,
		priority,
		url: task.permalink_url || null,
		dueDate: task.due_at || task.due_on || null,
		labels: task.tags?.map((tag: any) => tag.name) || [],
		attributes: {
			completed: task.completed,
			assigneeStatus: task.assignee_status,
			customFields: task.custom_fields,
		},
	};
};

export class AsanaConnector {
	private apiKey: string;
	private baseUrl: string = "https://app.asana.com/api/1.0";

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	private async apiRequest(
		endpoint: string,
		method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
		params: Record<string, any> = {},
		body?: any
	): Promise<any> {
		const url = new URL(`${this.baseUrl}/${endpoint}`);

		if (method === "GET") {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined) {
					url.searchParams.append(key, value.toString());
				}
			});
		}

		const response = await fetch(url.toString(), {
			method,
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				Accept: "application/json",
				...(body ? { "Content-Type": "application/json" } : {}),
			},
			...(body ? { body: JSON.stringify(body) } : {}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Asana API error: ${response.status} - ${errorData.errors?.[0]?.message || "Unknown error"}`
			);
		}

		return response.json();
	}

	/**
	 * Test connection and get user info
	 */
	async testConnection(): Promise<{
		userGid: string;
		userName: string;
		email: string;
		workspaces: Array<{ gid: string; name: string }>;
	}> {
		try {
			const response = await this.apiRequest("users/me");
			const user = response.data;

			return {
				userGid: user.gid,
				userName: user.name,
				email: user.email,
				workspaces: user.workspaces.map((ws: any) => ({
					gid: ws.gid,
					name: ws.name,
				})),
			};
		} catch (error) {
			console.error("Asana connection test failed:", error);
			throw new Error("Failed to connect to Asana");
		}
	}

	/**
	 * Create webhook for a project or workspace
	 */
	async createWebhook(
		resourceGid: string,
		targetUrl: string
	): Promise<{
		gid: string;
		resource: { gid: string; name: string };
		target: string;
		active: boolean;
	}> {
		try {
			const response = await this.apiRequest(
				"webhooks",
				"POST",
				{},
				{
					data: {
						resource: resourceGid,
						target: targetUrl,
						filters: [
							{ resource_type: "task", action: "changed" },
							{ resource_type: "task", action: "added" },
							{ resource_type: "task", action: "removed" },
							{ resource_type: "project", action: "changed" },
							{ resource_type: "project", action: "removed" },
							{ resource_type: "story", action: "added" },
						],
					},
				}
			);
			console.log("Asana webhook creation immediate resp: ", response);

			return {
				gid: response.data.gid,
				resource: response.data.resource,
				target: response.data.target,
				active: response.data.active,
			};
		} catch (error) {
			console.error("Failed to create Asana webhook:", error);
			throw error;
		}
	}

	/**
	 * Delete webhook
	 */
	async deleteWebhook(webhookGid: string): Promise<void> {
		try {
			await this.apiRequest(`webhooks/${webhookGid}`, "DELETE");
		} catch (error) {
			console.error("Failed to delete Asana webhook:", error);
			throw error;
		}
	}

	/**
	 * List all webhooks
	 */
	async listWebhooks(workspaceGid: string): Promise<any[]> {
		try {
			const response = await this.apiRequest("webhooks", "GET", {
				workspace: workspaceGid,
			});
			return response.data || [];
		} catch (error) {
			console.error("Failed to list Asana webhooks:", error);
			return [];
		}
	}

	/**
	 * Create a new project
	 */
	async createProject(
		workspaceGid: string,
		project: {
			name: string;
			notes?: string;
			archived?: boolean;
			public?: boolean;
			dueOn?: string;
			startOn?: string;
			teamGid?: string;
		}
	): Promise<ProjectData> {
		try {
			const response = await this.apiRequest(
				"projects",
				"POST",
				{},
				{
					data: {
						name: project.name,
						notes: project.notes || "",
						archived: project.archived || false,
						public: project.public || false,
						due_on: project.dueOn || null,
						start_on: project.startOn || null,
						workspace: workspaceGid,
						...(project.teamGid ? { team: project.teamGid } : {}),
					},
				}
			);

			const createdProject = response.data;

			return mapProject(createdProject);
		} catch (error) {
			console.error("[ASANA_CREATE_PROJECT_ERROR]", error);
			throw new Error(
				`Failed to create Asana project: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Update an existing project
	 */
	async updateProject(
		projectGid: string,
		updates: {
			name?: string;
			notes?: string;
			archived?: boolean;
			public?: boolean;
			dueOn?: string | null;
			startOn?: string | null;
		}
	): Promise<ProjectData> {
		try {
			const response = await this.apiRequest(
				`projects/${projectGid}`,
				"PUT",
				{},
				{
					data: {
						name: updates.name,
						notes: updates.notes,
						archived: updates.archived,
						public: updates.public,
						due_on: updates.dueOn,
						start_on: updates.startOn,
					},
				}
			);

			const updatedProject = response.data;

			return mapProject(updatedProject);
		} catch (error) {
			console.error("[ASANA_UPDATE_PROJECT_ERROR]", error);
			throw new Error(
				`Failed to update Asana project: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Delete a project
	 */
	async deleteProject(projectGid: string): Promise<void> {
		try {
			await this.apiRequest(`projects/${projectGid}`, "DELETE");
		} catch (error) {
			console.error("[ASANA_DELETE_PROJECT_ERROR]", error);
			throw new Error(
				`Failed to delete Asana project: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	async fetchProjects(
		workspaceGid: string,
		params: PaginationOptions
	): Promise<PaginatedResponse<ProjectData>> {
		try {
			const { page = 1, limit = 50, search = "" } = params;

			const response = await this.apiRequest("projects", "GET", {
				workspace: workspaceGid,
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
				].join(","),
			});

			let projects: any[] = response.data || [];

			if (search) {
				projects = projects.filter((project: any) =>
					project.name.toLowerCase().includes(search.toLowerCase())
				);
			}

			const mappedProjects: ProjectData[] = projects.map((project: any) =>
				mapProject(project)
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

	async getProject(projectGid: string): Promise<ProjectData> {
		try {
			const response = await this.apiRequest(
				`projects/${projectGid}`,
				"GET"
			);
			const project = response.data as Record<string, any>;
			return mapProject(project);
		} catch (error) {
			console.error("[ASANA_GET_PROJECT_ERROR]", error);
			throw new Error(
				`Failed to get Asana project: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Create a new task in a project
	 */
	async createTask(
		projectGid: string,
		task: {
			title: string;
			description?: string;
			assigneeId?: string;
			dueDate?: string;
			priority?: "low" | "medium" | "high" | "urgent";
			labels?: string[];
			completed?: boolean;
		}
	): Promise<TaskData> {
		try {
			const response = await this.apiRequest(
				"tasks",
				"POST",
				{},
				{
					data: {
						name: task.title,
						notes: task.description || "",
						assignee: task.assigneeId || null,
						due_on: task.dueDate || null,
						completed: task.completed || false,
						projects: [projectGid],
						...(task.priority
							? {
									custom_fields: {
										priority: task.priority, // Assumes a custom field named "Priority" exists
									},
								}
							: {}),
						...(task.labels && task.labels.length > 0
							? { tags: task.labels }
							: {}),
					},
				}
			);

			const createdTask = response.data;

			return mapTask(createdTask);
		} catch (error) {
			console.error("[ASANA_CREATE_TASK_ERROR]", error);
			throw new Error(
				`Failed to create Asana task: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Update an existing task
	 */
	async updateTask(
		taskGid: string,
		updates: {
			title?: string;
			description?: string;
			assigneeId?: string | null;
			dueDate?: string | null;
			priority?: "low" | "medium" | "high" | "urgent" | null;
			labels?: string[];
			completed?: boolean;
		}
	): Promise<TaskData> {
		try {
			const response = await this.apiRequest(
				`tasks/${taskGid}`,
				"PUT",
				{},
				{
					data: {
						name: updates.title,
						notes: updates.description,
						assignee: updates.assigneeId,
						due_on: updates.dueDate,
						completed: updates.completed,
						...(updates.priority
							? {
									custom_fields: {
										priority: updates.priority,
									},
								}
							: {}),
						...(updates.labels ? { tags: updates.labels } : {}),
					},
				}
			);

			const updatedTask = response.data;

			return mapTask(updatedTask);
		} catch (error) {
			console.error("[ASANA_UPDATE_TASK_ERROR]", error);
			throw new Error(
				`Failed to update Asana task: ${error instanceof Error ? error.message : "Unknown error"}`
			);
		}
	}

	/**
	 * Delete a task
	 */
	async deleteTask(taskGid: string): Promise<void> {
		try {
			await this.apiRequest(`tasks/${taskGid}`, "DELETE");
		} catch (error) {
			console.error("[ASANA_DELETE_TASK_ERROR]", error);
			throw new Error(
				`Failed to delete Asana task: ${error instanceof Error ? error.message : "Unknown error"}`
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

			const response = await this.apiRequest(
				`projects/${projectGid}/tasks`,
				"GET",
				{
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
					].join(","),
				}
			);
			const tasks: any[] = response.data || [];

			const mappedTasks: TaskData[] = tasks.map((task: any) =>
				mapTask(task)
			);

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

	/**
	 * Get a single task by GID
	 */
	async getTask(taskGid: string): Promise<TaskData> {
		try {
			const response = await this.apiRequest(`tasks/${taskGid}`, "GET", {
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
				].join(","),
			});

			const task = response.data;

			return mapTask(task);
		} catch (error) {
			console.error(`Failed to fetch task ${taskGid}:`, error);
			throw error;
		}
	}
}
