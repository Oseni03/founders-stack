"use server";

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

export async function getCommits(organizationId: string, repoId: string) {
	const commits = await prisma.commit.findMany({
		where: { organizationId, repositoryId: repoId },
	});
	return commits;
}
