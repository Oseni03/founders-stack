/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { CannyConnector } from "@/lib/connectors/canny";
import { prisma } from "@/lib/prisma";
import { getIntegration } from "../integrations";
import { Project } from "@prisma/client";

export async function connectCannyIntegration(input: {
	organizationId: string;
	apiKey: string;
	displayName?: string;
}) {
	const { organizationId, apiKey, displayName } = input;

	const connector = new CannyConnector(apiKey);
	const isValid = await connector.testConnection();

	if (!isValid) throw new Error("Invalid Canny API key");

	const integration = await prisma.integration.upsert({
		where: {
			organizationId_toolName: {
				organizationId,
				toolName: "canny",
			},
		},
		update: {
			category: "FEEDBACK", // or 'FEEDBACK'
			displayName: displayName || `Canny-`,
			status: "CONNECTED",
			apiKey,
			webhookSetupType: "MANUAL", // User configures in Canny UI
			lastSyncAt: new Date(),
		},
		create: {
			organizationId,
			toolName: "canny",
			category: "FEEDBACK", // or 'FEEDBACK'
			displayName: displayName || `Canny-`,
			status: "CONNECTED",
			apiKey,
			webhookSetupType: "MANUAL", // User configures in Canny UI
			lastSyncAt: new Date(),
		},
	});

	return {
		integrationId: integration.id,
		status: "CONNECTED",
		message: "Canny connected (polling mode)",
	};
}

export async function syncCanny(organizationId: string, projs: Project[] = []) {
	const integration = await getIntegration(organizationId, "canny");
	if (!integration?.apiKey) {
		throw new Error("Integration not connected");
	}

	// Validate attributes and baseUrl exist
	if (!integration.attributes || typeof integration.attributes !== "object") {
		throw new Error("Integration attributes not found");
	}

	const attributes = integration.attributes as Record<string, any>;
	const created = attributes.created;

	let projects;

	if (projs.length === 0) {
		projects = await prisma.project.findMany({
			where: { organizationId, sourceTool: "canny" },
		});
	} else {
		projects = projs;
	}

	if (projects.length === 0) return;

	const connector = new CannyConnector(integration.apiKey);

	const syncPromises = projects.map((project) => async () => {
		try {
			const { resources: posts } = await connector.getPosts(
				project.externalId!,
				{
					page: 1,
					limit: 50,
				}
			);

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
		} catch (error) {
			console.error(
				`❌ Sync failed for Canny project - ${project.name}:`,
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
