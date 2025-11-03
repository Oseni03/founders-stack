/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { GitHubConnector } from "@/lib/connectors/github";
import { prisma } from "@/lib/prisma";
import {
	BranchData,
	CommitData,
	ContributorData,
	IssueData,
	PullRequestData,
	RepoData,
} from "@/types/code";
import { syncGitHub } from "../platforms/github";

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
		const results = await prisma.$transaction(
			repos.map((repo) =>
				prisma.repository.upsert({
					where: {
						externalId_sourceTool: {
							externalId: repo.externalId,
							sourceTool: "github",
						},
					},
					update: {
						// ✅ Update main fields
						name: repo.name,
						fullName: repo.fullName,
						owner: repo.owner,
						description: repo.description,
						defaultBranch: repo.defaultBranch,
						language: repo.language,
						isPrivate: repo.isPrivate,
						isArchived: repo.isArchived,
						// ✅ Update attributes with additional metadata
						attributes: {
							url: repo.url,
							openIssuesCount: repo.openIssuesCount,
							forksCount: repo.forksCount,
							stargazersCount: repo.stargazersCount,
							...(repo.attributes || {}), // Include any extra attributes
						},
					},
					create: {
						// ✅ Create with all main fields
						organizationId,
						name: repo.name,
						fullName: repo.fullName,
						owner: repo.owner,
						description: repo.description,
						externalId: repo.externalId,
						sourceTool: "github",
						defaultBranch: repo.defaultBranch,
						language: repo.language,
						isPrivate: repo.isPrivate,
						isArchived: repo.isArchived,
						// ✅ Create with attributes metadata
						attributes: {
							url: repo.url,
							openIssuesCount: repo.openIssuesCount,
							forksCount: repo.forksCount,
							stargazersCount: repo.stargazersCount,
							...(repo.attributes || {}), // Include any extra attributes
						},
					},
				})
			)
		);

		// Sync related data (commits, PRs, issues, etc.)
		await syncGitHub(organizationId, results);

		return results; // Return the created/updated repositories
	} catch (error) {
		console.error("Failed to save repositories:", error);
		throw new Error("Failed to save repositories due to an internal error");
	}
}

// ============================================================================
// ADDITIONAL SAVE FUNCTIONS FOR OTHER ENTITIES
// ============================================================================

export async function saveCommits(
	organizationId: string,
	repositoryId: string,
	commits: CommitData[]
) {
	try {
		const results = await prisma.$transaction(
			commits.map((commit) =>
				prisma.commit.upsert({
					where: {
						externalId_sourceTool: {
							externalId: commit.externalId,
							sourceTool: "github",
						},
					},
					update: {
						sha: commit.sha,
						branch: commit.branch,
						authorName: commit.authorName,
						authorEmail: commit.authorEmail,
						committerName: commit.committerName,
						avatarUrl: commit.avatarUrl,
						message: commit.message,
						committedAt: commit.committedAt,
						url: commit.url,
						additions: commit.additions,
						deletions: commit.deletions,
						total: commit.total,
						attributes: commit.attributes || {},
					},
					create: {
						organizationId,
						repositoryId,
						externalId: commit.externalId,
						sourceTool: "github",
						sha: commit.sha || commit.externalId,
						branch: commit.branch,
						authorName: commit.authorName,
						authorEmail: commit.authorEmail,
						committerName: commit.committerName,
						avatarUrl: commit.avatarUrl,
						message: commit.message,
						committedAt: commit.committedAt,
						url: commit.url,
						additions: commit.additions,
						deletions: commit.deletions,
						total: commit.total,
						attributes: commit.attributes || {},
					},
				})
			)
		);

		return results;
	} catch (error) {
		console.error("Failed to save commits:", error);
		throw new Error("Failed to save commits due to an internal error");
	}
}

export async function savePullRequests(
	organizationId: string,
	repositoryId: string,
	pullRequests: PullRequestData[]
) {
	try {
		const results = await prisma.$transaction(
			pullRequests.map((pr) =>
				prisma.pullRequest.upsert({
					where: {
						externalId_sourceTool: {
							externalId: pr.externalId,
							sourceTool: "github",
						},
					},
					update: {
						number: pr.number,
						title: pr.title,
						url: pr.url,
						status: pr.status,
						reviewStatus: pr.reviewStatus,
						isDraft: pr.isDraft,
						baseBranch: pr.baseBranch,
						headBranch: pr.headBranch,
						authorId: pr.authorId,
						reviewerIds: pr.reviewerIds,
						mergedAt: pr.mergedAt,
						closedAt: pr.closedAt,
						avgReviewTime: pr.avgReviewTime,
						attributes: pr.attributes || {},
					},
					create: {
						organizationId,
						repositoryId,
						externalId: pr.externalId,
						sourceTool: "github",
						number: pr.number,
						title: pr.title,
						url: pr.url,
						status: pr.status,
						reviewStatus: pr.reviewStatus,
						isDraft: pr.isDraft,
						baseBranch: pr.baseBranch,
						headBranch: pr.headBranch,
						authorId: pr.authorId,
						reviewerIds: pr.reviewerIds,
						createdAt: pr.createdAt,
						mergedAt: pr.mergedAt,
						closedAt: pr.closedAt,
						avgReviewTime: pr.avgReviewTime,
						attributes: pr.attributes || {},
					},
				})
			)
		);

		return results;
	} catch (error) {
		console.error("Failed to save pull requests:", error);
		throw new Error(
			"Failed to save pull requests due to an internal error"
		);
	}
}

export async function saveIssues(
	organizationId: string,
	repositoryId: string,
	issues: IssueData[]
) {
	try {
		const results = await prisma.$transaction(
			issues.map((issue) =>
				prisma.issue.upsert({
					where: {
						externalId_sourceTool: {
							externalId: issue.externalId,
							sourceTool: "github",
						},
					},
					update: {
						number: issue.number,
						title: issue.title,
						body: issue.body,
						url: issue.url,
						status: issue.status,
						authorId: issue.authorId,
						assigneeIds: issue.assigneeIds,
						labels: issue.labels,
						commentsCount: issue.commentsCount,
						closedAt: issue.closedAt,
						attributes: issue.attributes || {},
					},
					create: {
						organizationId,
						repositoryId,
						externalId: issue.externalId,
						sourceTool: "github",
						number: issue.number,
						title: issue.title,
						body: issue.body,
						url: issue.url,
						status: issue.status,
						authorId: issue.authorId,
						assigneeIds: issue.assigneeIds,
						labels: issue.labels,
						commentsCount: issue.commentsCount,
						createdAt: issue.createdAt,
						closedAt: issue.closedAt,
						attributes: issue.attributes || {},
					},
				})
			)
		);

		return results;
	} catch (error) {
		console.error("Failed to save issues:", error);
		throw new Error("Failed to save issues due to an internal error");
	}
}

export async function saveBranches(
	organizationId: string,
	repositoryId: string,
	branches: BranchData[]
) {
	try {
		const results = await prisma.$transaction(
			branches.map((branch) =>
				prisma.branch.upsert({
					where: {
						externalId_sourceTool: {
							externalId: branch.externalId,
							sourceTool: "github",
						},
					},
					update: {
						name: branch.name,
						sha: branch.sha,
						isProtected: branch.isProtected,
						createdBy: branch.createdBy,
						status: branch.status,
						lastCommitAt: branch.lastCommitAt,
						commitsAhead: branch.commitsAhead,
						commitsBehind: branch.commitsBehind,
						attributes: branch.attributes || {},
					},
					create: {
						organizationId,
						repositoryId,
						externalId: branch.externalId,
						sourceTool: "github",
						name: branch.name,
						sha: branch.sha,
						isProtected: branch.isProtected,
						createdBy: branch.createdBy,
						status: branch.status,
						lastCommitAt: branch.lastCommitAt,
						commitsAhead: branch.commitsAhead,
						commitsBehind: branch.commitsBehind,
						attributes: branch.attributes || {},
					},
				})
			)
		);

		return results;
	} catch (error) {
		console.error("Failed to save branches:", error);
		throw new Error("Failed to save branches due to an internal error");
	}
}

export async function saveContributors(
	organizationId: string,
	repositoryId: string,
	contributors: ContributorData[]
) {
	try {
		const results = await prisma.$transaction(
			contributors.map((contributor) =>
				prisma.contributor.upsert({
					where: {
						externalId_sourceTool: {
							externalId: contributor.externalId,
							sourceTool: "github",
						},
					},
					update: {
						login: contributor.login,
						name: contributor.name,
						email: contributor.email,
						avatarUrl: contributor.avatarUrl,
						contributions: contributor.contributions,
						lastContributedAt: contributor.lastContributedAt,
						attributes: contributor.attributes || {},
					},
					create: {
						organizationId,
						repositoryId,
						externalId: contributor.externalId,
						sourceTool: "github",
						login: contributor.login,
						name: contributor.name,
						email: contributor.email,
						avatarUrl: contributor.avatarUrl,
						contributions: contributor.contributions,
						lastContributedAt: contributor.lastContributedAt,
						attributes: contributor.attributes || {},
					},
				})
			)
		);

		return results;
	} catch (error) {
		console.error("Failed to save contributors:", error);
		throw new Error("Failed to save contributors due to an internal error");
	}
}

// ============================================================================
// COMPREHENSIVE SYNC FUNCTION
// ============================================================================

export async function syncRepositoryData(
	organizationId: string,
	repositoryId: string,
	data: {
		commits?: CommitData[];
		pullRequests?: PullRequestData[];
		issues?: IssueData[];
		branches?: BranchData[];
		contributors?: ContributorData[];
	}
) {
	try {
		const results: any = {};

		if (data.commits && data.commits.length > 0) {
			results.commits = await saveCommits(
				organizationId,
				repositoryId,
				data.commits
			);
		}

		if (data.pullRequests && data.pullRequests.length > 0) {
			results.pullRequests = await savePullRequests(
				organizationId,
				repositoryId,
				data.pullRequests
			);
		}

		if (data.issues && data.issues.length > 0) {
			results.issues = await saveIssues(
				organizationId,
				repositoryId,
				data.issues
			);
		}

		if (data.branches && data.branches.length > 0) {
			results.branches = await saveBranches(
				organizationId,
				repositoryId,
				data.branches
			);
		}

		if (data.contributors && data.contributors.length > 0) {
			results.contributors = await saveContributors(
				organizationId,
				repositoryId,
				data.contributors
			);
		}

		return results;
	} catch (error) {
		console.error("Failed to sync repository data:", error);
		throw new Error(
			"Failed to sync repository data due to an internal error"
		);
	}
}

// ============================================================================
// BATCH SYNC WITH HEALTH COMPUTATION
// ============================================================================

export async function syncRepositoryWithHealth(
	organizationId: string,
	repositoryId: string,
	githubConnector: GitHubConnector // GitHubConnector instance
) {
	try {
		// Fetch all data in parallel
		const [commits, pullRequests, issues, branches, contributors, health] =
			await Promise.all([
				githubConnector.fetchCommits(),
				githubConnector.fetchPullRequests(),
				githubConnector.fetchIssues(),
				githubConnector.fetchBranches(),
				githubConnector.fetchContributors(),
				githubConnector.computeRepositoryHealth(),
			]);

		// Sync all data
		await syncRepositoryData(organizationId, repositoryId, {
			commits,
			pullRequests,
			issues,
			branches,
			contributors,
		});

		// Update repository health
		await prisma.repositoryHealth.upsert({
			where: { repositoryId },
			update: {
				healthScore: health.healthScore,
				openIssues: health.openIssues,
				stalePrs: health.stalePrs,
				avgReviewTime: health.avgReviewTime,
				testCoverage: health.testCoverage,
			},
			create: {
				repositoryId,
				organizationId,
				healthScore: health.healthScore,
				openIssues: health.openIssues,
				stalePrs: health.stalePrs,
				avgReviewTime: health.avgReviewTime,
				testCoverage: health.testCoverage,
			},
		});

		return {
			commits: commits.length,
			pullRequests: pullRequests.length,
			issues: issues.length,
			branches: branches.length,
			contributors: contributors.length,
			health,
		};
	} catch (error) {
		console.error("Failed to sync repository with health:", error);
		throw new Error(
			"Failed to sync repository with health due to an internal error"
		);
	}
}
