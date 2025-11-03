/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import {
	NormalizedAnalyticsEvent,
	PostHogConnector,
} from "@/lib/connectors/posthog";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface ConnectPostHogInput {
	organizationId: string;
	apiKey: string;
	projectId: string;
	displayName?: string;
	webhookConfirmed: boolean;
}

export async function connectPostHogIntegration(
	input: ConnectPostHogInput
): Promise<{
	integrationId: string;
	projectId: string;
	webhookId?: string;
	status: string;
	message: string;
}> {
	const { organizationId, apiKey, projectId, displayName, webhookConfirmed } =
		input;

	// Validate inputs
	if (!organizationId || !apiKey || !projectId) {
		throw new Error("Missing required fields");
	}

	try {
		// Step 1: Initialize connector and test connection
		console.log("Testing PostHog connection...");
		const connector = new PostHogConnector(apiKey, projectId);
		const projectInfo = await connector.testConnection();

		// Step 3: Save integration to database
		const integration = await prisma.integration.upsert({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "posthog",
				},
			},
			update: {
				category: "ANALYTICS",
				displayName:
					displayName || `PostHog (${projectInfo.projectName})`,
				status: "CONNECTED",

				apiKey,
				webhookSetupType: "AUTOMATIC",
				webhookConfirmed,

				metadata: {
					projectId: projectInfo.projectId,
					projectName: projectInfo.projectName,
					organizationId: projectInfo.organizationId,
					organizationName: projectInfo.organizationName,
				},

				lastSyncAt: new Date(),
			},
			create: {
				organizationId,
				toolName: "posthog",
				category: "ANALYTICS",
				displayName:
					displayName || `PostHog (${projectInfo.projectName})`,
				status: "CONNECTED",

				apiKey,
				webhookSetupType: "AUTOMATIC",
				webhookConfirmed,

				metadata: {
					projectId: projectInfo.projectId,
					projectName: projectInfo.projectName,
					organizationId: projectInfo.organizationId,
					organizationName: projectInfo.organizationName,
				},
				lastSyncAt: new Date(),
			},
		});

		console.log("Integration saved:", integration.id);

		// Step 5: Create or link PostHog Project
		const project = await prisma.project.upsert({
			where: {
				externalId_sourceTool: {
					externalId: projectInfo.projectId,
					sourceTool: "posthog",
				},
			},
			create: {
				organizationId,
				externalId: projectInfo.projectId,
				sourceTool: "posthog",
				name: projectInfo.projectName,
				attributes: {
					posthogOrganizationId: projectInfo.organizationId,
					posthogOrganizationName: projectInfo.organizationName,
				} as Prisma.InputJsonValue,
			},
			update: {
				name: projectInfo.projectName,
			},
		});

		console.log("Project linked:", project.id);

		// Step 6: Start initial sync (async)
		startPostHogInitialSync(
			integration.id,
			apiKey,
			projectInfo.projectId,
			organizationId,
			project.id
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
			projectId: project.id,
			status: "CONNECTED",
			message: "PostHog webhook not set yet by user",
		};
	} catch (error) {
		console.error("Failed to connect PostHog:", error);
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to connect PostHog integration"
		);
	}
}

// ============================================================================
// INITIAL SYNC FUNCTION
// ============================================================================

async function startPostHogInitialSync(
	integrationId: string,
	apiKey: string,
	projectId: string,
	organizationId: string,
	dbProjectId: string
): Promise<void> {
	console.log(
		`Starting PostHog initial sync for integration ${integrationId}`
	);

	try {
		const integration = await prisma.integration.findUnique({
			where: { id: integrationId },
		});

		if (!integration) {
			throw new Error("Integration not found");
		}

		// Update status to syncing
		await prisma.integration.update({
			where: { id: integrationId },
			data: { status: "SYNCING" },
		});

		const connector = new PostHogConnector(apiKey, projectId);

		// Phase 1: Sync last 30 days of events
		console.log("Phase 1: Syncing events (last 30 days)...");
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const events = await connector.getEvents({
			after: thirtyDaysAgo.toISOString(),
			limit: 5000, // Reasonable limit for initial sync
		});

		console.log(`Fetched ${events.length} events from PostHog`);

		// Phase 2: Save to database in batches
		console.log("Phase 2: Saving events to database...");
		const batchSize = 500;
		for (let i = 0; i < events.length; i += batchSize) {
			const batch = events.slice(i, i + batchSize);

			await prisma.analyticsEvent.createMany({
				data: batch.map((event) => ({
					sourceTool: "posthog",
					organizationId,
					projectId: dbProjectId,
					externalId: event.externalId,
					eventType: event.eventType,
					referrer: event.referrer,
					referringDomain: event.referringDomain,
					timezone: event.timezone,
					pathname: event.pathname,
					deviceType: event.deviceType,
					browserLanguagePrefix: event.browserLanguagePrefix,
					geoipCityName: event.geoipCityName,
					geoipCountryName: event.geoipCountryName,
					geoipCountryCode: event.geoipCountryCode,
					geoipContinentName: event.geoipContinentName,
					geoipContinentCode: event.geoipContinentCode,
					duration: event.duration,
					timestamp: event.timestamp,
					attributes: event.attributes,
				})),
				skipDuplicates: true,
			});

			console.log(
				`Saved batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(events.length / batchSize)}`
			);
		}

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

export async function disconnectPostHogIntegration(
	organizationId: string
): Promise<{ success: boolean; message: string }> {
	try {
		const integration = await prisma.integration.findUnique({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "posthog",
				},
			},
		});

		if (!integration || integration.toolName !== "posthog") {
			throw new Error("PostHog integration not found");
		}

		const apiKey = integration.apiKey!;
		const projectId = (integration.metadata as any)?.projectId;

		// Delete webhook if it exists
		if (integration.webhookId && projectId) {
			try {
				const connector = new PostHogConnector(apiKey, projectId);
				await connector.deleteWebhook(integration.webhookId);
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
					toolName: "posthog",
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
			message: "PostHog integration disconnected successfully",
		};
	} catch (error) {
		console.error("Failed to disconnect PostHog:", error);
		throw new Error(
			error instanceof Error
				? error.message
				: "Failed to disconnect PostHog integration"
		);
	}
}

// ============================================================================
// SYNC FUNCTION (On-Demand or Scheduled)
// ============================================================================

export async function syncPostHog(
	organizationId: string,
	projectId?: string
): Promise<NormalizedAnalyticsEvent[]> {
	const integration = await prisma.integration.findFirst({
		where: {
			organizationId,
			toolName: "posthog",
			status: "CONNECTED",
		},
	});

	if (!integration?.apiKey) {
		throw new Error("PostHog integration not connected");
	}

	let dbProjectId: string;

	if (projectId) {
		dbProjectId = projectId;
	} else {
		const project = await prisma.project.findFirst({
			where: {
				organizationId,
				sourceTool: "posthog",
			},
		});

		if (!project) {
			throw new Error("PostHog project not found");
		}

		dbProjectId = project.id;
	}

	const phProjectId = (integration.metadata as any)?.projectId;
	const connector = new PostHogConnector(integration.apiKey, phProjectId);

	// Fetch events since last sync
	const lastSync =
		integration.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000);

	const events = await connector.getEvents({
		after: lastSync.toISOString(),
		limit: 1000,
	});

	if (events.length > 0) {
		await prisma.analyticsEvent.createMany({
			data: events.map((event) => ({
				sourceTool: "posthog",
				organizationId,
				projectId: dbProjectId,
				externalId: event.externalId,
				eventType: event.eventType,
				referrer: event.referrer,
				referringDomain: event.referringDomain,
				timezone: event.timezone,
				pathname: event.pathname,
				deviceType: event.deviceType,
				browserLanguagePrefix: event.browserLanguagePrefix,
				geoipCityName: event.geoipCityName,
				geoipCountryName: event.geoipCountryName,
				geoipCountryCode: event.geoipCountryCode,
				geoipContinentName: event.geoipContinentName,
				geoipContinentCode: event.geoipContinentCode,
				duration: event.duration,
				timestamp: event.timestamp,
				attributes: event.attributes,
			})),
			skipDuplicates: true,
		});
	}

	// Update last sync time
	await prisma.integration.update({
		where: { id: integration.id },
		data: { lastSyncAt: new Date() },
	});

	return events;
}
