"use server";
import { prisma } from "@/lib/prisma";
import { RepoData } from "@/types/code";

export async function saveRepositories(
	organizationId: string,
	data: RepoData[]
) {
	try {
		const results = await Promise.allSettled(
			data.map((repo) =>
				prisma.repository.upsert({
					where: {
						externalId_platform: {
							externalId: repo.externalId,
							platform: repo.platform,
						},
					},
					update: {
						name: repo.name,
						fullName: repo.fullName,
						owner: repo.owner, // Added
						description: repo.description,
						url: repo.url,
						language: repo.language,
						isPrivate: repo.isPrivate,
						defaultBranch: repo.defaultBranch,
						stars: repo.stars,
						openIssues: repo.openIssues,
						openPRs: repo.openPRs,
						metadata: repo.metadata ?? undefined,
						updatedAt: repo.updatedAt,
						syncedAt: new Date(),
					},
					create: {
						externalId: repo.externalId,
						name: repo.name,
						fullName: repo.fullName,
						owner: repo.owner, // Added - this was missing
						description: repo.description,
						platform: repo.platform,
						url: repo.url,
						language: repo.language,
						isPrivate: repo.isPrivate,
						defaultBranch: repo.defaultBranch,
						stars: repo.stars,
						openIssues: repo.openIssues,
						openPRs: repo.openPRs,
						metadata: repo.metadata ?? undefined,
						createdAt: repo.createdAt,
						updatedAt: repo.updatedAt,
						syncedAt: new Date(),
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
				"Failed to save some repositories:",
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
		console.error("Error saving repositories:", error);
		throw new Error("Failed to save repositories");
	}
}
