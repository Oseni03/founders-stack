"use server";

import { RepoData, syncGitHub } from "@/lib/connectors/github";
import { prisma } from "@/lib/prisma";

export async function getRepositories(organizationId: string) {
	const repositories = await prisma.repository.findMany({
		where: { organizationId },
	});
	return repositories;
}

export async function getRepository(repoId: string, organizationId: string) {
	const repository = await prisma.repository.findUnique({
		where: { id: repoId, organizationId },
		include: { health: true },
	});
	return repository;
}

export async function deleteRepository(repositoryId: string) {
	try {
		const response = await prisma.repository.delete({
			where: { id: repositoryId },
		});

		return response;
	} catch (error) {
		console.error("[DELETE_REPOSITORY_ACTION]", error);
		throw error;
	}
}

export async function getBranches(organizationId: string, repoId: string) {
	const branches = await prisma.branch.findMany({
		where: { organizationId, repositoryId: repoId },
	});
	return branches;
}

export async function getContributors(organizationId: string, repoId: string) {
	const contributors = await prisma.contributor.findMany({
		where: { organizationId, repositoryId: repoId },
	});
	return contributors;
}

export async function getPullRequests(organizationId: string, repoId: string) {
	const pullRequests = await prisma.pullRequest.findMany({
		where: { organizationId, repositoryId: repoId },
	});
	return pullRequests;
}

export async function getIssues(organizationId: string, repoId: string) {
	const issues = await prisma.issue.findMany({
		where: { organizationId, repositoryId: repoId },
	});
	return issues;
}

export async function getCommits(organizationId: string, repoId: string) {
	const commits = await prisma.commit.findMany({
		where: { organizationId, repositoryId: repoId },
	});
	return commits;
}

export async function saveRepositories(
	organizationId: string,
	repos: RepoData[]
) {
	try {
		// Batch upsert using Prisma's $transaction
		await prisma.$transaction(
			repos.map((repo) =>
				prisma.repository.upsert({
					where: {
						externalId_sourceTool: {
							externalId: repo.externalId,
							sourceTool: "github",
						},
					},
					update: {
						attributes: {
							url: repo.url,
							defaultBranch: repo.defaultBranch,
							openIssuesCount: repo.openIssuesCount,
							visibility: repo.visibility,
							description: repo.description,
						},
					},
					create: {
						organizationId,
						name: repo.name,
						owner: repo.owner!,
						externalId: repo.externalId,
						sourceTool: "github",
						attributes: { url: repo.url }, // Optional URL
					},
				})
			)
		);

		await syncGitHub(organizationId);

		return repos; // Return the input repos for chaining or confirmation
	} catch (error) {
		console.error("Failed to save repositories:", error);
		throw new Error("Failed to save repositories due to an internal error");
	}
}
