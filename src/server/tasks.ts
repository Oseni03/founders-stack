"use server";

import { ProjectData, syncAsana } from "@/lib/connectors/asana";
import { prisma } from "@/lib/prisma";

export async function saveProjects(
	organizationId: string,
	projects: ProjectData[]
) {
	try {
		const projs = await prisma.$transaction(
			projects.map((project) =>
				prisma.project.upsert({
					where: {
						externalId_sourceTool: {
							externalId: project.externalId,
							sourceTool: "asana",
						},
					},
					update: {
						name: project.name,
						description: project.description,
						attributes: project.attributes,
					},
					create: {
						organizationId,
						name: project.name,
						externalId: project.externalId,
						description: project.description,
						attributes: project.attributes,
						sourceTool: "asana",
					},
				})
			)
		);

		await syncAsana(organizationId, projs);

		return projects;
	} catch (error) {
		console.error("Failed to save Asana projects:", error);
		throw new Error(
			"Failed to save Asana projects due to an internal error"
		);
	}
}

export async function getTasks(organizationId: string) {
	const tasks = await prisma.task.findMany({ where: { organizationId } });
	return tasks;
}
