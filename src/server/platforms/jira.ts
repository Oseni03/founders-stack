/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getIntegration } from "@/server/integrations";
import { prisma } from "@/lib/prisma";
import { Project } from "@prisma/client";
import { JiraConnector } from "@/lib/connectors/jira";
import { generateWebhookUrl } from "@/lib/utils";

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
		throw new Error("Failed to fetch accessible resources");
	}

	return response.json();
}

export async function connectJiraIntegration(input: {
	organizationId: string;
	accessToken: string;
	refreshToken?: string;
	expiresIn: number;
}) {
	const { organizationId, accessToken, expiresIn, refreshToken } = input;

	if (!organizationId || !accessToken || !expiresIn) {
		throw new Error("Missing required fields");
	}

	try {
		const resources = await getAccessibleResources(accessToken);

		if (resources.length === 0) {
			throw new Error("No accessible Jira sites found");
		}

		// Use first accessible resource (or let user choose in a more advanced implementation)
		const primaryResource = resources[0];
		const cloudId = primaryResource.id;
		const baseUrl = primaryResource.url;

		// Calculate token expiry
		const expiresAt = new Date(Date.now() + expiresIn * 1000);

		// Update integration with OAuth credentials
		const integration = await prisma.integration.upsert({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "jira",
				},
			},
			update: {
				status: "CONNECTED",
				type: "oauth2",
				accessToken,
				refreshToken: refreshToken || null,
				category: "PROJECT_MGMT",
				tokenExpiresAt: expiresAt,
			},
			create: {
				category: "PROJECT_MGMT",
				status: "CONNECTED",
				toolName: "jira",
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

		// Create webhook
		const connector = new JiraConnector(accessToken, cloudId);
		const webhookUrl = generateWebhookUrl(organizationId, "jira");

		const webhook = await connector.createWebhook(webhookUrl, [
			"jira:issue_created",
			"jira:issue_updated",
			"jira:issue_deleted",
			"comment_created",
			"comment_updated",
			"comment_deleted",
			"worklog_updated",
		]);

		// Store webhook info
		await prisma.integration.update({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "jira",
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

		return {
			status: "CONNECTED",
			message: "Jira integration connected with real-time webhook",
			cloudId,
		};
	} catch (error) {
		console.error("Jira connection failed:", error);
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to connect Jira integration"
		);
	}
}

export async function syncJira(organizationId: string, projs: Project[] = []) {
	const integration = await getIntegration(organizationId, "jira");
	if (!integration?.apiKey) {
		throw new Error("Integration not connected");
	}

	// Validate attributes and baseUrl exist
	if (!integration.attributes || typeof integration.attributes !== "object") {
		throw new Error("Integration attributes not found");
	}

	const attributes = integration.attributes as Record<string, any>;
	const cloudId = attributes.cloudId;

	if (!cloudId) {
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

	const connector = new JiraConnector(integration.apiKey, cloudId);

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

// ============================================================================
// DISCONNECT INTEGRATION
// ============================================================================

export async function disconnectJiraIntegration(
	organizationId: string
): Promise<{ success: boolean; message: string }> {
	try {
		const integration = await prisma.integration.findUnique({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "jira",
				},
			},
		});

		if (!integration || integration.toolName !== "jira") {
			throw new Error("Jira integration not found");
		}

		const apiKey = integration.apiKey!;
		const attributes = integration.attributes as Record<string, any>;
		const cloudId = attributes.cloudId;

		// Delete webhook if exists
		if (integration.webhookId) {
			try {
				const connector = new JiraConnector(apiKey, cloudId);
				await connector.deleteWebhook(
					integration.webhookId as unknown as number
				);
				console.log(`Deleted webhook ${integration.webhookId}`);
			} catch (error) {
				console.warn("Failed to delete webhook:", error);
			}
		}

		// Update integration status
		await prisma.integration.update({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "jira",
				},
			},
			data: {
				status: "DISCONNECTED",
				webhookId: null,
				webhookUrl: null,
			},
		});

		return {
			success: true,
			message: "Jira integration disconnected successfully",
		};
	} catch (error) {
		console.error("Failed to disconnect Jira:", error);
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to disconnect Jira integration"
		);
	}
}
