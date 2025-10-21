"use server";

import { syncAsana } from "@/lib/connectors/asana";
import { syncJira } from "@/lib/connectors/jira";
import { prisma } from "@/lib/prisma";
import { ProjectData } from "@/types/connector";

export async function saveProjects(
	organizationId: string,
	sourceTool: string,
	projects: ProjectData[]
) {
	try {
		const projs = await prisma.$transaction(
			projects.map((project) =>
				prisma.project.upsert({
					where: {
						externalId_sourceTool: {
							externalId: project.externalId,
							sourceTool,
						},
					},
					update: {
						...project,
					},
					create: {
						...project,
						organizationId,
						sourceTool,
					},
				})
			)
		);

		if (sourceTool === "asana") {
			await syncAsana(organizationId, projs);
		} else if (sourceTool === "jira") {
			await syncJira(organizationId, projs);
		} else {
			console.error("Sync function not available for ", sourceTool);
		}

		return projects;
	} catch (error) {
		console.error(`Failed to save ${sourceTool} projects:`, error);
		throw new Error(
			`Failed to save ${sourceTool} projects due to an internal error`
		);
	}
}

export async function getTasks(organizationId: string) {
	const tasks = await prisma.task.findMany({ where: { organizationId } });
	return tasks;
}
