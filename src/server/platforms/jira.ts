/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getIntegration } from "@/server/integrations";
import { prisma } from "@/lib/prisma";
import { Project } from "@prisma/client";
import { JiraConnector } from "@/lib/connectors/jira";
import { generateWebhookUrl } from "@/lib/utils";
import { ConnectionHandlerResult } from "@/types/connector";

export interface JiraAccessibleResource {
	id: string;
	url: string;
	name: string;
	scopes: string[];
	avatarUrl: string;
}

export async function getAccessibleResources(
	accessToken: string
): Promise<JiraAccessibleResource[]> {
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Fetching Jira accessible resources`
	);

	try {
		const response = await fetch(
			"https://api.atlassian.com/oauth/token/accessible-resources",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/json",
				},
			}
		);

		if (!response.ok) {
			const errorMsg = `Failed to fetch accessible resources: HTTP ${response.status} ${response.statusText}`;
			console.error(`[${new Date().toISOString()}] ${errorMsg}`);
			throw new Error("Failed to fetch accessible resources");
		}

		const resources = await response.json();
		const duration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Fetched ${resources.length} accessible resources in ${duration}ms`
		);
		return resources;
	} catch (error) {
		const errorMsg =
			error instanceof Error ? error.message : "Unknown error";
		console.error(
			`[${new Date().toISOString()}] Failed to fetch Jira accessible resources: ${errorMsg}`
		);
		throw error;
	}
}

export async function createWebhook(
	organizationId: string,
	projectKeys: string[]
) {
	try {
		const integration = await getIntegration(organizationId, "jira");
		const attributes = integration?.attributes as Record<string, any>;
		const cloudId = attributes.cloudId;
		const accessToken = integration?.accessToken;

		// Validate integration
		console.log(
			`[${new Date().toISOString()}] Validating integration existance`
		);
		if (!integration || !accessToken || !cloudId) {
			const errorMsg =
				"Integration not found: Integration does not exist";
			console.error(`[${new Date().toISOString()}] ${errorMsg}`);
			throw new Error(errorMsg);
		}

		// Create webhook
		console.log(
			`[${new Date().toISOString()}] Initializing Jira connector for webhook creation`
		);
		const connector = new JiraConnector(accessToken, cloudId);
		const webhookUrl = generateWebhookUrl(organizationId, "jira");
		console.log(
			`[${new Date().toISOString()}] Generated webhook URL: ${webhookUrl}`
		);

		console.log(
			`[${new Date().toISOString()}] Creating Jira webhook with events: jira:issue_created, jira:issue_updated, jira:issue_deleted, comment_created, comment_updated, comment_deleted, worklog_updated`
		);
		const webhookStart = Date.now();
		const webhook = await connector.createWebhook(
			webhookUrl,
			[
				"jira:issue_created",
				"jira:issue_updated",
				"jira:issue_deleted",
				"comment_created",
				"comment_updated",
				"comment_deleted",
			],
			projectKeys
		);
		const webhookDuration = Date.now() - webhookStart;
		console.log(
			`[${new Date().toISOString()}] Webhook created successfully in ${webhookDuration}ms: WebhookID=${webhook.webhookId}`
		);

		// Store webhook info
		console.log(
			`[${new Date().toISOString()}] Updating integration with webhook details`
		);
		const webhookUpdateStart = Date.now();
		await prisma.integration.update({
			where: {
				organizationId_platform: {
					organizationId,
					platform: "jira",
				},
			},
			data: {
				webhookUrl,
				webhookId: webhook.webhookId,
				webhookSetupType: "AUTOMATIC",
				attributes: {
					...(integration.attributes as Record<string, any>),
				},
			},
		});
		const webhookUpdateDuration = Date.now() - webhookUpdateStart;
		console.log(
			`[${new Date().toISOString()}] Integration updated with webhook details in ${webhookUpdateDuration}ms`
		);
	} catch (error) {
		const errorMsg =
			error instanceof Error
				? error.message
				: "Failed to create Jira webhook";
		console.error(
			`[${new Date().toISOString()}] Failed to create Jira webhook for organization ${organizationId}: ${errorMsg}`
		);
		throw new Error(errorMsg);
	}
}

export async function connectJiraIntegration(input: {
	organizationId: string;
	accessToken: string;
	refreshToken?: string;
	expiresIn: number;
}): Promise<ConnectionHandlerResult> {
	const { organizationId, accessToken, expiresIn, refreshToken } = input;
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Jira integration for organization ${organizationId}`
	);

	// Validate inputs
	console.log(`[${new Date().toISOString()}] Validating input parameters`);
	if (!organizationId || !accessToken || !expiresIn) {
		const errorMsg =
			"Missing required fields: organizationId, accessToken, or expiresIn";
		console.error(`[${new Date().toISOString()}] ${errorMsg}`);
		throw new Error(errorMsg);
	}

	try {
		// Fetch accessible resources
		console.log(
			`[${new Date().toISOString()}] Fetching accessible Jira resources`
		);
		const resourceStart = Date.now();
		const resources = await getAccessibleResources(accessToken);
		const resourceDuration = Date.now() - resourceStart;

		if (resources.length === 0) {
			const errorMsg = "No accessible Jira sites found";
			console.error(`[${new Date().toISOString()}] ${errorMsg}`);
			throw new Error(errorMsg);
		}
		const primaryResource = resources[0];
		const cloudId = primaryResource.id;
		const baseUrl = primaryResource.url;
		console.log(
			`[${new Date().toISOString()}] Selected primary resource in ${resourceDuration}ms: CloudID=${cloudId}, URL=${baseUrl}`
		);

		// Calculate token expiry
		const expiresAt = new Date(Date.now() + expiresIn * 1000);
		console.log(
			`[${new Date().toISOString()}] Calculated token expiry: ${expiresAt.toISOString()}`
		);

		// Save integration
		console.log(
			`[${new Date().toISOString()}] Saving Jira integration to database`
		);
		const dbStart = Date.now();
		const integration = await prisma.integration.upsert({
			where: {
				organizationId_platform: {
					organizationId,
					platform: "jira",
				},
			},
			update: {
				status: "CONNECTED",
				type: "oauth2",
				accessToken,
				refreshToken: refreshToken || null,
				category: "PROJECT_TRACKING",
				tokenExpiresAt: expiresAt,
			},
			create: {
				category: "PROJECT_TRACKING",
				status: "CONNECTED",
				platform: "jira",
				type: "oauth2",
				accessToken,
				refreshToken: refreshToken || null,
				organizationId,
				tokenExpiresAt: expiresAt,
				lastSyncAt: new Date(),
				attributes: {
					cloudId,
					baseUrl,
				},
			},
		});
		const dbDuration = Date.now() - dbStart;
		console.log(
			`[${new Date().toISOString()}] Integration saved successfully in ${dbDuration}ms: IntegrationID=${integration.id}`
		);

		const totalDuration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Jira integration completed in ${totalDuration}ms: IntegrationID=${integration.id}, CloudID=${cloudId}, Status=CONNECTED`
		);

		return {
			status: "CONNECTED",
			message: "Jira integration connected with real-time webhook",
			integrationId: integration.id,
		};
	} catch (error) {
		const errorMsg =
			error instanceof Error
				? error.message
				: "Failed to connect Jira integration";
		console.error(
			`[${new Date().toISOString()}] Failed to connect Jira integration for organization ${organizationId}: ${errorMsg}`
		);
		throw new Error(errorMsg);
	}
}

export async function syncJira(organizationId: string, projs: Project[] = []) {
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Jira sync for organization ${organizationId}`
	);

	// Validate integration
	console.log(`[${new Date().toISOString()}] Fetching Jira integration`);
	const integration = await getIntegration(organizationId, "jira");
	if (!integration?.apiKey) {
		const errorMsg = "Integration not connected";
		console.error(
			`[${new Date().toISOString()}] ${errorMsg} for organization ${organizationId}`
		);
		throw new Error(errorMsg);
	}
	console.log(
		`[${new Date().toISOString()}] Found integration: IntegrationID=${integration.id}`
	);

	// Validate attributes
	console.log(
		`[${new Date().toISOString()}] Validating integration attributes`
	);
	if (!integration.attributes || typeof integration.attributes !== "object") {
		const errorMsg = "Integration attributes not found";
		console.error(
			`[${new Date().toISOString()}] ${errorMsg} for integration ${integration.id}`
		);
		throw new Error(errorMsg);
	}
	const attributes = integration.attributes as Record<string, any>;
	const cloudId = attributes.cloudId;
	if (!cloudId) {
		const errorMsg = "Jira cloudId not configured";
		console.error(
			`[${new Date().toISOString()}] ${errorMsg} for integration ${integration.id}`
		);
		throw new Error("Jira base URL not configured");
	}
	console.log(
		`[${new Date().toISOString()}] Integration attributes validated: CloudID=${cloudId}`
	);

	// Get projects to sync
	let projects;
	if (projs.length === 0) {
		console.log(
			`[${new Date().toISOString()}] Fetching Jira projects from database`
		);
		const projectFetchStart = Date.now();
		projects = await prisma.project.findMany({
			where: { organizationId, platform: "jira" },
		});
		const projectFetchDuration = Date.now() - projectFetchStart;
		console.log(
			`[${new Date().toISOString()}] Fetched ${projects.length} projects in ${projectFetchDuration}ms`
		);
	} else {
		projects = projs;
		console.log(
			`[${new Date().toISOString()}] Using provided projects: Count=${projs.length}`
		);
	}

	if (projects.length === 0) {
		console.log(`[${new Date().toISOString()}] No projects to sync`);
		return { projectsSynced: 0, tasksSynced: 0 };
	}
	console.log(
		`[${new Date().toISOString()}] Syncing ${projects.length} projects`
	);

	// Initialize connector
	console.log(
		`[${new Date().toISOString()}] Initializing Jira connector with cloudId ${cloudId}`
	);
	const connector = new JiraConnector(integration.apiKey, cloudId);

	let projectsSynced = 0;
	let tasksSynced = 0;
	const concurrencyLimit = 5;

	// Sync in batches
	const syncPromises = projects.map((project) => async () => {
		try {
			console.log(
				`[${new Date().toISOString()}] Fetching issues for project ${project.name} (ExternalID=${project.externalId})`
			);
			const issueFetchStart = Date.now();
			const { resources: tasks } = await connector.getIssues(
				project.externalId!,
				{
					page: 1,
					limit: 50,
				}
			);
			const issueFetchDuration = Date.now() - issueFetchStart;
			console.log(
				`[${new Date().toISOString()}] Fetched ${tasks.length} issues for project ${project.name} in ${issueFetchDuration}ms`
			);

			if (tasks.length > 0) {
				console.log(
					`[${new Date().toISOString()}] Creating ${tasks.length} tasks for project ${project.name}`
				);
				const taskCreateStart = Date.now();
				await prisma.task.createMany({
					data: tasks.map((task) => ({
						...task,
						organizationId,
						projectId: project.id,
						sourceTool: "jira",
						integrationId: integration.id,
					})),
					skipDuplicates: true,
				});
				const taskCreateDuration = Date.now() - taskCreateStart;
				console.log(
					`[${new Date().toISOString()}] Created ${tasks.length} tasks for project ${project.name} in ${taskCreateDuration}ms`
				);
				tasksSynced += tasks.length;
			} else {
				console.log(
					`[${new Date().toISOString()}] No issues found for project ${project.name}`
				);
			}
			projectsSynced++;
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : "Unknown error";
			console.error(
				`[${new Date().toISOString()}] Failed to sync project ${project.name} (ExternalID=${project.externalId}): ${errorMsg}`
			);
		}
	});

	console.log(
		`[${new Date().toISOString()}] Processing ${syncPromises.length} sync tasks with concurrency limit ${concurrencyLimit}`
	);
	for (let i = 0; i < syncPromises.length; i += concurrencyLimit) {
		const batch = syncPromises.slice(i, i + concurrencyLimit);
		const batchStart = Date.now();
		console.log(
			`[${new Date().toISOString()}] Processing batch of ${batch.length} projects (batch ${i / concurrencyLimit + 1})`
		);
		await Promise.all(batch.map((fn) => fn()));
		const batchDuration = Date.now() - batchStart;
		console.log(
			`[${new Date().toISOString()}] Completed batch of ${batch.length} projects in ${batchDuration}ms`
		);
	}

	const totalDuration = Date.now() - startTime;
	console.log(
		`[${new Date().toISOString()}] Jira sync completed in ${totalDuration}ms: ` +
			`ProjectsSynced=${projectsSynced}, TasksSynced=${tasksSynced}`
	);

	return {
		projectsSynced,
		tasksSynced,
	};
}

// ============================================================================
// DISCONNECT INTEGRATION
// ============================================================================

export async function disconnectJiraIntegration(
	organizationId: string
): Promise<{ success: boolean; message: string }> {
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Jira disconnection for organization ${organizationId}`
	);

	try {
		console.log(`[${new Date().toISOString()}] Fetching Jira integration`);
		const integration = await prisma.integration.findUnique({
			where: {
				organizationId_platform: {
					organizationId,
					platform: "jira",
				},
			},
		});

		if (!integration || integration.platform !== "jira") {
			const errorMsg = "Jira integration not found";
			console.error(
				`[${new Date().toISOString()}] ${errorMsg} for organization ${organizationId}`
			);
			throw new Error(errorMsg);
		}
		console.log(
			`[${new Date().toISOString()}] Found integration: IntegrationID=${integration.id}`
		);

		const apiKey = integration.apiKey!;
		const attributes = integration.attributes as Record<string, any>;
		const cloudId = attributes.cloudId;

		// Delete webhook if exists
		if (integration.webhookId) {
			console.log(
				`[${new Date().toISOString()}] Deleting webhook ${integration.webhookId}`
			);
			try {
				const connector = new JiraConnector(apiKey, cloudId);
				const webhookDeleteStart = Date.now();
				await connector.deleteWebhook(
					integration.webhookId as unknown as number
				);
				const webhookDeleteDuration = Date.now() - webhookDeleteStart;
				console.log(
					`[${new Date().toISOString()}] Webhook ${integration.webhookId} deleted successfully in ${webhookDeleteDuration}ms`
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
				organizationId_platform: {
					organizationId,
					platform: "jira",
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
			`[${new Date().toISOString()}] Jira integration disconnected successfully in ${totalDuration}ms`
		);

		return {
			success: true,
			message: "Jira integration disconnected successfully",
		};
	} catch (error) {
		const errorMsg =
			error instanceof Error
				? error.message
				: "Failed to disconnect Jira integration";
		console.error(
			`[${new Date().toISOString()}] Failed to disconnect Jira integration for organization ${organizationId}: ${errorMsg}`
		);
		throw new Error(errorMsg);
	}
}
