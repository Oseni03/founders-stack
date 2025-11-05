"use server";

import { AsanaConnector } from "@/lib/connectors/asana";
import { prisma } from "@/lib/prisma";
import { generateWebhookUrl } from "@/lib/utils";
import { Project } from "@prisma/client";

interface ConnectAsanaInput {
	organizationId: string;
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
	const { organizationId, apiKey, workspaceGid, displayName } = input;
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Asana integration for organization ${organizationId}`
	);

	// Validate inputs
	console.log(`[${new Date().toISOString()}] Validating input parameters`);
	if (!organizationId || !apiKey) {
		const errorMsg = "Missing required fields: organizationId or apiKey";
		console.error(`[${new Date().toISOString()}] ${errorMsg}`);
		throw new Error(errorMsg);
	}

	try {
		// Step 1: Test connection
		console.log(
			`[${new Date().toISOString()}] Initializing Asana connector and testing connection`
		);
		const connector = new AsanaConnector(apiKey);
		const connectionStart = Date.now();
		const userInfo = await connector.testConnection();
		const connectionDuration = Date.now() - connectionStart;
		console.log(
			`[${new Date().toISOString()}] Asana connection tested successfully in ${connectionDuration}ms: ` +
				`User=${userInfo.userName}, UserGid=${userInfo.userGid}, Workspaces=${userInfo.workspaces.length}`
		);

		// Use provided workspace or first available
		const workspace = workspaceGid || userInfo.workspaces[0]?.gid;
		const workspaceName = workspaceGid
			? userInfo.workspaces.find((ws) => ws.gid === workspaceGid)?.name
			: userInfo.workspaces[0]?.name;

		if (!workspace) {
			const errorMsg = "No Asana workspace available";
			console.error(`[${new Date().toISOString()}] ${errorMsg}`);
			throw new Error(errorMsg);
		}
		console.log(
			`[${new Date().toISOString()}] Selected workspace: Gid=${workspace}, Name=${workspaceName}`
		);

		// Step 2: Try to create webhook (automatic mode)
		const webhookUrl = generateWebhookUrl(organizationId, "asana");
		console.log(
			`[${new Date().toISOString()}] Generated webhook URL: ${webhookUrl}`
		);
		let webhookGid: string | undefined;
		let webhookMode: "automatic" | "polling" = "polling";

		try {
			console.log(
				`[${new Date().toISOString()}] Attempting to create Asana webhook for workspace ${workspace}`
			);
			const webhookStart = Date.now();
			const webhook = await connector.createWebhook(
				workspace,
				webhookUrl
			);
			webhookGid = webhook.gid;
			webhookMode = "automatic";
			const webhookDuration = Date.now() - webhookStart;
			console.log(
				`[${new Date().toISOString()}] Webhook created successfully in ${webhookDuration}ms: WebhookGid=${webhookGid}`
			);
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Unknown error";
			console.warn(
				`[${new Date().toISOString()}] Failed to create webhook for workspace ${workspace}, falling back to polling mode: ${errorMsg}`
			);
			// Webhook creation failed - continue with polling mode
		}

		// Step 3: Save integration
		console.log(
			`[${new Date().toISOString()}] Saving Asana integration to database`
		);
		const dbStart = Date.now();
		const integration = await prisma.integration.upsert({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "asana",
				},
			},
			update: {
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
			create: {
				organizationId,
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
		const dbDuration = Date.now() - dbStart;
		console.log(
			`[${new Date().toISOString()}] Integration saved successfully in ${dbDuration}ms: IntegrationID=${integration.id}, WebhookMode=${webhookMode}`
		);

		const totalDuration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Asana integration completed in ${totalDuration}ms: ` +
				`IntegrationID=${integration.id}, Status=CONNECTED, WebhookMode=${webhookMode}`
		);

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
		const errorMsg =
			error instanceof Error
				? error.message
				: "Failed to connect Asana integration";
		console.error(
			`[${new Date().toISOString()}] Failed to connect Asana integration for organization ${organizationId}: ${errorMsg}`
		);
		throw new Error(errorMsg);
	}
}

// ============================================================================
// DISCONNECT INTEGRATION
// ============================================================================

export async function disconnectAsanaIntegration(
	organizationId: string
): Promise<{ success: boolean; message: string }> {
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Asana disconnection for organization ${organizationId}`
	);

	try {
		console.log(`[${new Date().toISOString()}] Fetching Asana integration`);
		const integration = await prisma.integration.findUnique({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "asana",
				},
			},
		});

		if (!integration || integration.toolName !== "asana") {
			const errorMsg = "Asana integration not found";
			console.error(
				`[${new Date().toISOString()}] ${errorMsg} for organization ${organizationId}`
			);
			throw new Error(errorMsg);
		}
		console.log(
			`[${new Date().toISOString()}] Found integration: IntegrationID=${integration.id}`
		);

		// Delete webhook if exists
		if (integration.webhookId) {
			console.log(
				`[${new Date().toISOString()}] Deleting webhook ${integration.webhookId}`
			);
			try {
				const connector = new AsanaConnector(integration.apiKey!);
				const webhookStart = Date.now();
				await connector.deleteWebhook(integration.webhookId);
				const webhookDuration = Date.now() - webhookStart;
				console.log(
					`[${new Date().toISOString()}] Webhook ${integration.webhookId} deleted successfully in ${webhookDuration}ms`
				);
			} catch (error) {
				const errorMsg =
					error instanceof Error ? error.message : "Unknown error";
				console.warn(
					`[${new Date().toISOString()}] Failed to delete webhook ${integration.webhookId}: ${errorMsg}`
				);
			}
		} else {
			console.log(
				`[${new Date().toISOString()}] No webhook found for integration ${integration.id}`
			);
		}

		// Update integration status
		console.log(
			`[${new Date().toISOString()}] Updating integration status to DISCONNECTED`
		);
		const dbStart = Date.now();
		await prisma.integration.update({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "asana",
				},
			},
			data: {
				status: "DISCONNECTED",
				webhookId: null,
				webhookUrl: null,
			},
		});
		const dbDuration = Date.now() - dbStart;
		console.log(
			`[${new Date().toISOString()}] Integration status updated to DISCONNECTED in ${dbDuration}ms`
		);

		const totalDuration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Asana integration disconnected successfully in ${totalDuration}ms`
		);

		return {
			success: true,
			message: "Asana integration disconnected successfully",
		};
	} catch (error) {
		const errorMsg =
			error instanceof Error
				? error.message
				: "Failed to disconnect Asana integration";
		console.error(
			`[${new Date().toISOString()}] Failed to disconnect Asana integration for organization ${organizationId}: ${errorMsg}`
		);
		throw new Error(errorMsg);
	}
}

// ============================================================================
// SYNC FUNCTION (On-Demand or Scheduled)
// ============================================================================

export async function syncAsana(
	organizationId: string,
	projs?: Project[]
): Promise<{ projectsSynced: number; tasksSynced: number }> {
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Asana sync for organization ${organizationId}`
	);

	// Validate integration
	console.log(`[${new Date().toISOString()}] Fetching Asana integration`);
	const integration = await prisma.integration.findFirst({
		where: {
			organizationId,
			toolName: "asana",
			status: "CONNECTED",
		},
	});

	if (!integration?.apiKey) {
		const errorMsg = "Asana integration not connected";
		console.error(
			`[${new Date().toISOString()}] ${errorMsg} for organization ${organizationId}`
		);
		throw new Error(errorMsg);
	}
	console.log(
		`[${new Date().toISOString()}] Found integration: IntegrationID=${integration.id}`
	);

	const apiKey = integration.apiKey;
	console.log(`[${new Date().toISOString()}] Initializing Asana connector`);
	const connector = new AsanaConnector(apiKey);

	// Get projects to sync
	let projects;
	if (projs && projs.length > 0) {
		projects = projs;
		console.log(
			`[${new Date().toISOString()}] Using provided projects: Count=${projs.length}`
		);
	} else {
		console.log(
			`[${new Date().toISOString()}] Fetching active Asana projects from database`
		);
		const projectFetchStart = Date.now();
		projects = await prisma.project.findMany({
			where: {
				organizationId,
				sourceTool: "asana",
				status: "active",
			},
		});
		const projectFetchDuration = Date.now() - projectFetchStart;
		console.log(
			`[${new Date().toISOString()}] Fetched ${projects.length} active projects in ${projectFetchDuration}ms`
		);
	}

	if (projects.length === 0) {
		console.log(`[${new Date().toISOString()}] No projects to sync`);
		return { projectsSynced: 0, tasksSynced: 0 };
	}
	console.log(
		`[${new Date().toISOString()}] Syncing ${projects.length} projects`
	);

	let totalTasks = 0;
	const concurrencyLimit = 5;
	let projectsSynced = 0;

	// Sync in batches
	for (let i = 0; i < projects.length; i += concurrencyLimit) {
		const batch = projects.slice(i, i + concurrencyLimit);
		console.log(
			`[${new Date().toISOString()}] Processing batch of ${batch.length} projects (batch ${i / concurrencyLimit + 1})`
		);

		const batchStart = Date.now();
		await Promise.all(
			batch.map(async (project) => {
				try {
					console.log(
						`[${new Date().toISOString()}] Fetching tasks for project ${project.name} (ExternalID=${project.externalId})`
					);
					const taskFetchStart = Date.now();
					const { resources: tasks } = await connector.fetchTasks(
						project.externalId!,
						{ limit: 100 }
					);
					const taskFetchDuration = Date.now() - taskFetchStart;
					console.log(
						`[${new Date().toISOString()}] Fetched ${tasks.length} tasks for project ${project.name} in ${taskFetchDuration}ms`
					);

					if (tasks.length > 0) {
						console.log(
							`[${new Date().toISOString()}] Creating ${tasks.length} tasks for project ${project.name}`
						);
						const taskCreateStart = Date.now();
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
						const taskCreateDuration = Date.now() - taskCreateStart;
						console.log(
							`[${new Date().toISOString()}] Created ${tasks.length} tasks for project ${project.name} in ${taskCreateDuration}ms`
						);
						totalTasks += tasks.length;
					} else {
						console.log(
							`[${new Date().toISOString()}] No tasks found for project ${project.name}`
						);
					}
					projectsSynced++;
				} catch (error) {
					const errorMsg =
						error instanceof Error
							? error.message
							: "Unknown error";
					console.error(
						`[${new Date().toISOString()}] Failed to sync project ${project.name} (ExternalID=${project.externalId}): ${errorMsg}`
					);
				}
			})
		);
		const batchDuration = Date.now() - batchStart;
		console.log(
			`[${new Date().toISOString()}] Completed batch of ${batch.length} projects in ${batchDuration}ms`
		);
	}

	// Update last sync time
	console.log(
		`[${new Date().toISOString()}] Updating integration last sync time`
	);
	const updateStart = Date.now();
	await prisma.integration.update({
		where: { id: integration.id },
		data: { lastSyncAt: new Date() },
	});
	const updateDuration = Date.now() - updateStart;
	console.log(
		`[${new Date().toISOString()}] Integration last sync time updated in ${updateDuration}ms`
	);

	const totalDuration = Date.now() - startTime;
	console.log(
		`[${new Date().toISOString()}] Asana sync completed in ${totalDuration}ms: ` +
			`ProjectsSynced=${projectsSynced}, TasksSynced=${totalTasks}`
	);

	return {
		projectsSynced,
		tasksSynced: totalTasks,
	};
}
