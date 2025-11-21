"use server";
import { prisma } from "@/lib/prisma";
import { ProjectData } from "@/types/connector";

export async function saveProjects(
	organizationId: string,
	platform: string,
	data: ProjectData[]
) {
	try {
		const results = await Promise.allSettled(
			data.map((project) =>
				prisma.project.upsert({
					where: {
						externalId_platform: {
							externalId: project.externalId,
							platform: platform,
						},
					},
					update: {
						name: project.name,
						description: project.description,
						avatarUrl: project.avatarUrl,
						url: project.url,
						status: project.status ?? "active",
						attributes: project.attributes ?? undefined,
						updatedAt: new Date(),
					},
					create: {
						externalId: project.externalId,
						name: project.name,
						description: project.description,
						avatarUrl: project.avatarUrl,
						url: project.url,
						platform: platform,
						status: project.status ?? "active",
						attributes: project.attributes ?? undefined,
						organizationId,
					},
				})
			)
		);

		const successful = results.filter(
			(r) => r.status === "fulfilled"
		).length;
		const failed = results.filter((r) => r.status === "rejected");

		if (failed.length > 0) {
			console.error(
				"Failed to save some projects:",
				failed.map((f) => (f.status === "rejected" ? f.reason : null))
			);
		}

		return {
			success: true,
			saved: successful,
			failed: failed.length,
			total: data.length,
		};
	} catch (error) {
		console.error("Error saving projects:", error);
		throw new Error("Failed to save projects");
	}
}
