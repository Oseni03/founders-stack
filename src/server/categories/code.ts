/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { prisma } from "@/lib/prisma";

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
