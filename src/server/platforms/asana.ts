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

	if (!organizationId || !apiKey) {
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
		const webhookUrl = generateWebhookUrl(organizationId, "asana");
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
