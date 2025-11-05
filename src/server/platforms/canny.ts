/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { CannyConnector } from "@/lib/connectors/canny";
import { prisma } from "@/lib/prisma";
import { getIntegration } from "../integrations";
import { Project } from "@prisma/client";
import { ConnectionHandlerResult } from "@/types/connector";

export async function connectCannyIntegration(input: {
	organizationId: string;
	apiKey: string;
	displayName?: string;
}): Promise<ConnectionHandlerResult> {
	const { organizationId, apiKey, displayName } = input;
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Canny integration for organization ${organizationId}`
	);

	// Validate inputs
	console.log(`[${new Date().toISOString()}] Validating input parameters`);
	if (!organizationId || !apiKey) {
		const errorMsg = "Missing required fields: organizationId or apiKey";
		console.error(`[${new Date().toISOString()}] ${errorMsg}`);
		throw new Error(errorMsg);
	}

	try {
		// Test connection
		console.log(
			`[${new Date().toISOString()}] Initializing Canny connector and testing connection`
		);
		const connector = new CannyConnector(apiKey);
		const connectionStart = Date.now();
		const isValid = await connector.testConnection();
		const connectionDuration = Date.now() - connectionStart;

		if (!isValid) {
			const errorMsg = "Invalid Canny API key";
			console.error(
				`[${new Date().toISOString()}] ${errorMsg} (connection test failed after ${connectionDuration}ms)`
			);
			throw new Error(errorMsg);
		}
		console.log(
			`[${new Date().toISOString()}] Canny connection tested successfully in ${connectionDuration}ms`
		);

		// Save integration
		console.log(
			`[${new Date().toISOString()}] Saving Canny integration to database`
		);
		const dbStart = Date.now();
		const integration = await prisma.integration.upsert({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "canny",
				},
			},
			update: {
				category: "FEEDBACK",
				displayName: displayName || `Canny-${organizationId}`,
				status: "CONNECTED",
				apiKey,
				webhookSetupType: "MANUAL",
				lastSyncAt: new Date(),
			},
			create: {
				organizationId,
				toolName: "canny",
				category: "FEEDBACK",
				displayName: displayName || `Canny-${organizationId}`,
				status: "CONNECTED",
				apiKey,
				webhookSetupType: "MANUAL",
				lastSyncAt: new Date(),
			},
		});
		const dbDuration = Date.now() - dbStart;
		console.log(
			`[${new Date().toISOString()}] Integration saved successfully in ${dbDuration}ms: IntegrationID=${integration.id}`
		);

		const totalDuration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] Canny integration completed in ${totalDuration}ms: IntegrationID=${integration.id}, Status=CONNECTED`
		);

		return {
			integrationId: integration.id,
			status: "CONNECTED",
			message: "Canny connected (polling mode)",
		};
	} catch (error) {
		const errorMsg =
			error instanceof Error
				? error.message
				: "Failed to connect Canny integration";
		console.error(
			`[${new Date().toISOString()}] Failed to connect Canny integration for organization ${organizationId}: ${errorMsg}`
		);
		throw new Error(errorMsg);
	}
}

export async function syncCanny(organizationId: string, projs: Project[] = []) {
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting Canny sync for organization ${organizationId}`
	);

	// Validate integration
	console.log(`[${new Date().toISOString()}] Fetching Canny integration`);
	const integration = await getIntegration(organizationId, "canny");
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
	const created = attributes.created;
	console.log(
		`[${new Date().toISOString()}] Integration attributes validated: Created=${created}`
	);

	// Get projects to sync
	let projects;
	if (projs.length === 0) {
		console.log(
			`[${new Date().toISOString()}] Fetching Canny projects from database`
		);
		const projectFetchStart = Date.now();
		projects = await prisma.project.findMany({
			where: { organizationId, sourceTool: "canny" },
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
		return { projectsSynced: 0, postsSynced: 0 };
	}
	console.log(
		`[${new Date().toISOString()}] Syncing ${projects.length} projects`
	);

	// Initialize connector
	console.log(`[${new Date().toISOString()}] Initializing Canny connector`);
	const connector = new CannyConnector(integration.apiKey);

	let projectsSynced = 0;
	let postsSynced = 0;
	const concurrencyLimit = 5;

	// Sync in batches
	const syncPromises = projects.map((project) => async () => {
		try {
			console.log(
				`[${new Date().toISOString()}] Fetching posts for project ${project.name} (ExternalID=${project.externalId})`
			);
			const postFetchStart = Date.now();
			const { resources: posts } = await connector.getPosts(
				project.externalId!,
				{
					page: 1,
					limit: 50,
				}
			);
			const postFetchDuration = Date.now() - postFetchStart;
			console.log(
				`[${new Date().toISOString()}] Fetched ${posts.length} posts for project ${project.name} in ${postFetchDuration}ms`
			);

			if (posts.length > 0) {
				console.log(
					`[${new Date().toISOString()}] Creating ${posts.length} posts for project ${project.name}`
				);
				const postCreateStart = Date.now();
				await prisma.feed.createMany({
					data: posts.map((post) => ({
						...post,
						organizationId,
						createdAt: (created as Date) || new Date(),
						projectId: project.id,
						sourceTool: "canny",
					})),
					skipDuplicates: true,
				});
				const postCreateDuration = Date.now() - postCreateStart;
				console.log(
					`[${new Date().toISOString()}] Created ${posts.length} posts for project ${project.name} in ${postCreateDuration}ms`
				);
				postsSynced += posts.length;
			} else {
				console.log(
					`[${new Date().toISOString()}] No posts found for project ${project.name}`
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
		`[${new Date().toISOString()}] Canny sync completed in ${totalDuration}ms: ` +
			`ProjectsSynced=${projectsSynced}, PostsSynced=${postsSynced}`
	);

	return {
		projectsSynced,
		postsSynced,
	};
}
