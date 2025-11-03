/* eslint-disable @typescript-eslint/no-explicit-any */
import { getIntegration } from "@/server/integrations";
import { prisma } from "../prisma";
import { Project } from "@prisma/client";
import { JiraConnector } from "@/server/platforms/jira";

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
