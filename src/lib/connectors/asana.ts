/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	PaginatedResponse,
	PaginationOptions,
	ProjectData,
} from "@/types/connector";
import { prisma } from "../prisma";
import { Project } from "@prisma/client";

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
	private apiKey: string;
	private baseUrl: string = "https://app.asana.com/api/1.0";

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	private async apiRequest(
		endpoint: string,
		method: "GET" | "POST" | "DELETE" = "GET",
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
	 * IMPORTANT: Webhook creation requires asynchronous handshake
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
					},
				}
			);

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

	async getProject(projectGid: string): Promise<ProjectData> {
		try {
			const response = await this.apiRequest(
				`projects/${projectGid}`,
				"GET"
			);
			const project = response.data as Record<string, any>;
			return {
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
			};
		} catch (error) {
			console.error("[ASANA_GET_PROJECT_ERROR]", error);
			throw new Error(
				`Failed to get Asana project: ${error instanceof Error ? error.message : "Unknown error"}`
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
						completed: task.completed,
						assigneeStatus: task.assignee_status,
						customFields: task.custom_fields,
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
					completed: task.completed,
					assigneeStatus: task.assignee_status,
					customFields: task.custom_fields,
				},
			};
		} catch (error) {
			console.error(`Failed to fetch task ${taskGid}:`, error);
			throw error;
		}
	}
}

interface ConnectAsanaInput {
	organizationId: string;
	userId: string;
	apiKey: string; // Personal Access Token
	workspaceGid?: string; // Optional: specific workspace to track
	displayName?: string;
}

export async function connectAsanaIntegration(
	input: ConnectAsanaInput
): Promise<{
	integrationId: string;
	webhookMode: "automatic" | "polling";
	status: string;
	message: string;
}> {
	const { organizationId, userId, apiKey, workspaceGid, displayName } = input;

	if (!organizationId || !userId || !apiKey) {
		throw new Error("Missing required fields");
	}

	try {
		// Step 1: Test connection
		console.log("Testing Asana connection...");
		const connector = new AsanaConnector(apiKey);
		const userInfo = await connector.testConnection();

		// Use provided workspace or first available
		const workspace = workspaceGid || userInfo.workspaces[0]?.gid;
		const workspaceName = workspaceGid
			? userInfo.workspaces.find((ws) => ws.gid === workspaceGid)?.name
			: userInfo.workspaces[0]?.name;

		if (!workspace) {
			throw new Error("No Asana workspace available");
		}

		// Step 2: Try to create webhook (automatic mode)
		const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/asana/${userId}/${organizationId}`;
		let webhookGid: string | undefined;
		let webhookMode: "automatic" | "polling" = "polling";

		try {
			console.log("Attempting to create Asana webhook...");
			const webhook = await connector.createWebhook(
				workspace,
				webhookUrl
			);
			webhookGid = webhook.gid;
			webhookMode = "automatic";
			console.log("Webhook created successfully:", webhookGid);
		} catch (error) {
			console.warn(
				"Failed to create webhook (will use polling mode):",
				error
			);
			// Webhook creation failed - continue with polling mode
		}

		// Step 3: Save integration
		const integration = await prisma.integration.create({
			data: {
				organizationId,
				userId,
				toolName: "asana",
				category: "PROJECT_MGMT",
				displayName: displayName || `Asana (${workspaceName})`,
				status: "CONNECTED",

				apiKey,
				webhookUrl: webhookGid ? webhookUrl : null,
				webhookId: webhookGid || null,
				webhookSetupType: webhookGid ? "AUTOMATIC" : "MANUAL",

				metadata: {
					workspaceGid: workspace,
					workspaceName,
					userGid: userInfo.userGid,
					userName: userInfo.userName,
					webhookMode,
				},

				lastSyncAt: new Date(),
			},
		});

		console.log("Integration saved:", integration.id);

		// Step 4: Start initial sync (async)
		startAsanaInitialSync(
			integration.id,
			apiKey,
			workspace,
			organizationId
		).catch((error) => {
			console.error("Initial sync failed:", error);
			prisma.integration.update({
				where: { id: integration.id },
				data: {
					status: "ERROR",
				},
			});
		});

		return {
			integrationId: integration.id,
			webhookMode,
			status: "CONNECTED",
			message:
				webhookMode === "automatic"
					? "Asana connected with real-time webhooks"
					: "Asana connected with polling (15 min sync)",
		};
	} catch (error) {
		console.error("Failed to connect Asana:", error);
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to connect Asana integration"
		);
	}
}

// ============================================================================
// INITIAL SYNC FUNCTION
// ============================================================================

async function startAsanaInitialSync(
	integrationId: string,
	apiKey: string,
	workspaceGid: string,
	organizationId: string
): Promise<void> {
	console.log(`Starting Asana initial sync for integration ${integrationId}`);

	try {
		const integration = await prisma.integration.findUnique({
			where: { id: integrationId },
		});

		if (!integration) {
			throw new Error("Integration not found");
		}

		// Update status
		await prisma.integration.update({
			where: { id: integrationId },
			data: { status: "SYNCING" },
		});

		const connector = new AsanaConnector(apiKey);

		// Phase 1: Fetch all projects
		console.log("Phase 1: Fetching projects...");
		const { resources: projects } = await connector.fetchProjects(
			workspaceGid,
			{}
		);
		console.log(`Fetched ${projects.length} projects`);

		// Phase 2: Save projects to database
		console.log("Phase 2: Saving projects...");
		const savedProjects = await Promise.all(
			projects.map(async (project) => {
				return await prisma.project.upsert({
					where: {
						externalId_sourceTool: {
							externalId: project.externalId,
							sourceTool: "asana",
						},
					},
					create: {
						organizationId,
						externalId: project.externalId,
						sourceTool: "asana",
						name: project.name,
						description: project.description,
						attributes: project.attributes,
						status: project.attributes.archived
							? "archived"
							: "active",
					},
					update: {
						name: project.name,
						description: project.description,
						attributes: project.attributes,
						status: project.attributes.archived
							? "archived"
							: "active",
					},
				});
			})
		);

		console.log(`Saved ${savedProjects.length} projects`);

		// Phase 3: Fetch tasks for each project
		console.log("Phase 3: Fetching tasks...");
		let totalTasks = 0;

		for (const project of savedProjects) {
			try {
				const { resources: tasks } = await connector.fetchTasks(
					project.externalId!,
					{}
				);

				if (tasks.length > 0) {
					await prisma.task.createMany({
						data: tasks.map((task) => ({
							organizationId,
							projectId: project.id,
							externalId: task.externalId,
							sourceTool: "asana",
							title: task.title,
							description: task.description,
							status: task.status,
							assignee: task.assignee,
							assigneeId: task.assigneeId,
							priority: task.priority,
							url: task.url,
							dueDate: task.dueDate
								? new Date(task.dueDate)
								: null,
							labels: task.labels,
							attributes: task.attributes,
						})),
						skipDuplicates: true,
					});

					totalTasks += tasks.length;
				}
			} catch (error) {
				console.error(
					`Failed to sync tasks for project ${project.name}:`,
					error
				);
			}
		}

		console.log(
			`Saved ${totalTasks} tasks across ${savedProjects.length} projects`
		);

		// Mark sync complete
		await prisma.integration.update({
			where: { id: integrationId },
			data: {
				status: "CONNECTED",
				lastSyncAt: new Date(),
				lastSyncStatus: "success",
			},
		});

		console.log(`Initial sync complete for integration ${integrationId}`);
	} catch (error) {
		console.error(
			`Initial sync failed for integration ${integrationId}:`,
			error
		);

		await prisma.integration.update({
			where: { id: integrationId },
			data: {
				status: "ERROR",
			},
		});

		throw error;
	}
}

// ============================================================================
// DISCONNECT INTEGRATION
// ============================================================================

export async function disconnectAsanaIntegration(
	integrationId: string
): Promise<{ success: boolean; message: string }> {
	try {
		const integration = await prisma.integration.findUnique({
			where: { id: integrationId },
		});

		if (!integration || integration.toolName !== "asana") {
			throw new Error("Asana integration not found");
		}

		const apiKey = integration.apiKey!;

		// Delete webhook if exists
		if (integration.webhookId) {
			try {
				const connector = new AsanaConnector(apiKey);
				await connector.deleteWebhook(integration.webhookId);
				console.log(`Deleted webhook ${integration.webhookId}`);
			} catch (error) {
				console.warn("Failed to delete webhook:", error);
			}
		}

		// Update integration status
		await prisma.integration.update({
			where: { id: integrationId },
			data: {
				status: "DISCONNECTED",
				webhookId: null,
				webhookUrl: null,
			},
		});

		return {
			success: true,
			message: "Asana integration disconnected successfully",
		};
	} catch (error) {
		console.error("Failed to disconnect Asana:", error);
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to disconnect Asana integration"
		);
	}
}

// ============================================================================
// SYNC FUNCTION (On-Demand or Scheduled)
// ============================================================================

export async function syncAsana(
	organizationId: string,
	projs?: Project[]
): Promise<{ projectsSynced: number; tasksSynced: number }> {
	const integration = await prisma.integration.findFirst({
		where: {
			organizationId,
			toolName: "asana",
			status: "CONNECTED",
		},
	});

	if (!integration?.apiKey) {
		throw new Error("Asana integration not connected");
	}

	const apiKey = integration.apiKey;
	const connector = new AsanaConnector(apiKey);

	// Get projects to sync
	let projects;
	if (projs && projs.length > 0) {
		projects = projs;
	} else {
		projects = await prisma.project.findMany({
			where: {
				organizationId,
				sourceTool: "asana",
				status: "active",
			},
		});
	}

	if (projects.length === 0) {
		return { projectsSynced: 0, tasksSynced: 0 };
	}

	let totalTasks = 0;
	const concurrencyLimit = 5;

	// Sync in batches
	for (let i = 0; i < projects.length; i += concurrencyLimit) {
		const batch = projects.slice(i, i + concurrencyLimit);

		await Promise.all(
			batch.map(async (project) => {
				try {
					const { resources: tasks } = await connector.fetchTasks(
						project.externalId!,
						{ limit: 100 }
					);

					if (tasks.length > 0) {
						await prisma.task.createMany({
							data: tasks.map((task) => ({
								organizationId,
								projectId: project.id,
								externalId: task.externalId,
								sourceTool: "asana",
								title: task.title,
								description: task.description,
								status: task.status,
								assignee: task.assignee,
								assigneeId: task.assigneeId,
								priority: task.priority,
								url: task.url,
								dueDate: task.dueDate
									? new Date(task.dueDate)
									: null,
								labels: task.labels,
								attributes: task.attributes,
								lastSyncedAt: new Date(),
							})),
							skipDuplicates: true,
						});

						totalTasks += tasks.length;
					}
				} catch (error) {
					console.error(
						`Failed to sync project ${project.name}:`,
						error
					);
				}
			})
		);
	}

	// Update last sync time
	await prisma.integration.update({
		where: { id: integration.id },
		data: { lastSyncAt: new Date() },
	});

	console.log(
		`Asana sync complete: ${projects.length} projects, ${totalTasks} tasks`
	);

	return {
		projectsSynced: projects.length,
		tasksSynced: totalTasks,
	};
}
