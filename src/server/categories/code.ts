/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { prisma } from "@/lib/prisma";
import { RepoData } from "@/types/code";

export async function getRepositories(organizationId: string) {
	return prisma.repository.findMany({
		where: { organizationId },
		orderBy: { updatedAt: "desc" },
	});
}

export async function getPullRequests(
	organizationId: string,
	filters: {
		status?: string;
		author?: string;
		reviewer?: string;
		repository?: string[];
		label?: string;
	}
) {
	const where: any = { repository: { organizationId } };
	if (filters.status) where.state = filters.status;
	if (filters.author && filters.author !== "All")
		where.authorName = filters.author;
	// Add more filter logic as needed (reviewer might require JSON query, label array contains)
	return prisma.pullRequest.findMany({
		where,
		orderBy: { updatedAt: "desc" },
		include: { repository: true },
	});
}

export async function getCommits(organizationId: string) {
	return prisma.commit.findMany({
		where: { repository: { organizationId } },
		orderBy: { timestamp: "desc" },
		include: { repository: true },
	});
}

export async function getBuilds(organizationId: string) {
	return prisma.build.findMany({
		where: { repository: { organizationId } },
		orderBy: { startedAt: "desc" },
		include: { repository: true },
	});
}

// Example mutation action (e.g., approve PR - would need to call external API)
export async function approvePullRequest(organizationId: string, prId: string) {
	const pr = await prisma.pullRequest.findFirst({
		where: { id: prId, repository: { organizationId } },
	});
	if (!pr) throw new Error("PR not found");
	// Here: Call external GitHub/GitLab API to approve
	// For example: await github.pulls.createReview({ ... });
	// Then update local DB
	await prisma.pullRequest.update({
		where: { id: prId },
		data: { approvalStatus: "Approved" }, // Simplified
	});
	return { success: true };
}

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
