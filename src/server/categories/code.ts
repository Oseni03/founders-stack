"use server";

import { GitHubConnector, WebhookConfig } from "@/lib/connectors/github";
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
import { generateWebhookUrl } from "@/lib/utils";
import { getIntegration } from "../integrations";
import logger from "@/lib/logger";

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
		const integration = await getIntegration(organizationId, "github");

		if (!integration || !integration.accessToken) {
			logger.error("GitHub integration not conected: ", {
				organizationId,
			});
			throw new Error("Github integratio not connected");
		}
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
						name: repo.name,
						fullName: repo.fullName,
						owner: repo.owner,
						description: repo.description,
						defaultBranch: repo.defaultBranch,
						language: repo.language,
						isPrivate: repo.isPrivate,
						isArchived: repo.isArchived,
						attributes: {
							url: repo.url,
							openIssuesCount: repo.openIssuesCount,
							forksCount: repo.forksCount,
							stargazersCount: repo.stargazersCount,
							...(repo.attributes || {}),
						},
					},
					create: {
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
						attributes: {
							url: repo.url,
							openIssuesCount: repo.openIssuesCount,
							forksCount: repo.forksCount,
							stargazersCount: repo.stargazersCount,
							...(repo.attributes || {}),
						},
					},
				})
			)
		);

		// Initialize GitHubConnector
		const githubConnector = new GitHubConnector(integration.accessToken);

		for (const repo of results) {
			// Create webhooks for each repository
			const webhookConfig: WebhookConfig = {
				url: generateWebhookUrl(repo.id, "github"), // Replace with your webhook endpoint
				contentType: "json",
				secret:
					process.env.GITHUB_WEBHOOK_SECRET || "your-webhook-secret", // Replace with your secret
				events: [
					"push",
					"pull_request",
					"issues",
					"status",
					"deployment",
					"repository",
					"create",
					"delete",
					"deployment_status",
				],
				active: true,
			};
			try {
				// Set owner and repo in GitHubConnector
				githubConnector.setRepository(repo.owner, repo.name);

				// Check if a webhook already exists for this URL
				const existingWebhooks = await githubConnector.listWebhooks();
				const webhookExists = existingWebhooks.resources.some(
					(hook) => hook.config.url === webhookConfig.url
				);

				if (!webhookExists) {
					// Create a new webhook
					const webhook =
						await githubConnector.createWebhook(webhookConfig);
					console.log(
						`Created webhook for ${repo.fullName} with ID ${webhook.id}`
					);

					// Optionally, store webhook details in the database
					await prisma.webhook.upsert({
						where: {
							externalId_sourceTool: {
								externalId: webhook.id.toString(),
								sourceTool: "github",
							},
						},
						update: {
							repositoryId: repo.id,
							url: webhook.config.url,
							events: webhook.events,
							active: webhook.active,
							attributes: {
								content_type: webhook.config.content_type,
								created_at: webhook.created_at,
								updated_at: webhook.updated_at,
							},
						},
						create: {
							repositoryId: repo.id,
							externalId: webhook.id.toString(),
							sourceTool: "github",
							url: webhook.config.url,
							events: webhook.events,
							active: webhook.active,
							attributes: {
								content_type: webhook.config.content_type,
								created_at: webhook.created_at,
								updated_at: webhook.updated_at,
							},
						},
					});
				} else {
					console.log(`Webhook already exists for ${repo.fullName}`);
				}
			} catch (error) {
				console.error(
					`Failed to create webhook for ${repo.fullName}:`,
					error
				);
				// Continue with other repositories instead of failing the entire operation
			}
		}

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

interface HealthMetrics {
	// Overall score
	healthScore: number;
	grade: "A" | "B" | "C" | "D" | "F";

	// Core metrics
	issueHealth: {
		score: number;
		openCount: number;
		avgResolutionHours: number;
		staleCount: number; // >60 days
	};

	prHealth: {
		score: number;
		openCount: number;
		avgReviewHours: number;
		staleCount: number; // >30 days
		mergeRate: number; // %
	};

	deploymentHealth: {
		score: number;
		weeklyFrequency: number;
		failureRate: number; // %
		avgRestoreHours: number;
	};

	activityHealth: {
		score: number;
		weeklyCommits: number;
		activeContributors: number;
		staleBranches: number; // >90 days
	};
}

/**
 * Compute repository health metrics from local database
 * No API calls - uses synced data only
 */
export async function computeRepositoryHealth(
	repositoryId: string,
	organizationId: string,
	daysWindow: number = 90 // Look back window
): Promise<HealthMetrics> {
	const windowDate = new Date();
	windowDate.setDate(windowDate.getDate() - daysWindow);

	// Run all queries in parallel
	const [
		issues,
		closedIssues,
		prs,
		closedPrs,
		deployments,
		commits,
		contributors,
		branches,
	] = await Promise.all([
		// Open issues
		prisma.issue.findMany({
			where: {
				repositoryId,
				organizationId,
				status: "open",
			},
			select: {
				id: true,
				createdAt: true,
			},
		}),

		// Recently closed issues (for avg resolution time)
		prisma.issue.findMany({
			where: {
				repositoryId,
				organizationId,
				status: "closed",
				closedAt: { gte: windowDate },
			},
			select: {
				createdAt: true,
				closedAt: true,
			},
		}),

		// Open PRs
		prisma.pullRequest.findMany({
			where: {
				repositoryId,
				organizationId,
				status: "open",
			},
			select: {
				id: true,
				createdAt: true,
			},
		}),

		// Recently closed/merged PRs
		prisma.pullRequest.findMany({
			where: {
				repositoryId,
				organizationId,
				status: { in: ["closed", "merged"] },
				closedAt: { gte: windowDate },
			},
			select: {
				status: true,
				createdAt: true,
				closedAt: true,
				avgReviewTime: true,
			},
		}),

		// Deployments
		prisma.deploymentEvent.findMany({
			where: {
				organizationId,
				deployedAt: { gte: windowDate },
				// Filter by commit's repository if needed
				Commit: {
					repositoryId,
				},
			},
			select: {
				status: true,
				deployedAt: true,
				buildDuration: true,
			},
			orderBy: { deployedAt: "asc" },
		}),

		// Commits
		prisma.commit.findMany({
			where: {
				repositoryId,
				organizationId,
				committedAt: { gte: windowDate },
			},
			select: {
				id: true,
				committedAt: true,
			},
		}),

		// Contributors
		prisma.contributor.findMany({
			where: {
				repositoryId,
				organizationId,
				lastContributedAt: { gte: windowDate },
			},
			select: {
				id: true,
			},
		}),

		// Branches
		prisma.branch.findMany({
			where: {
				repositoryId,
				organizationId,
			},
			select: {
				name: true,
				lastCommitAt: true,
			},
		}),
	]);

	// ===== 1. ISSUE HEALTH =====
	const now = Date.now();
	const staleIssues = issues.filter((issue) => {
		const daysSinceCreated =
			(now - issue.createdAt.getTime()) / (1000 * 60 * 60 * 24);
		return daysSinceCreated > 60;
	});

	const avgIssueResolutionHours =
		closedIssues.length > 0
			? closedIssues.reduce((sum, issue) => {
					const hours =
						(issue.closedAt!.getTime() -
							issue.createdAt.getTime()) /
						(1000 * 60 * 60);
					return sum + hours;
				}, 0) / closedIssues.length
			: 0;

	// Issue health score (0-100)
	let issueScore = 100;
	issueScore -= Math.min(issues.length * 0.5, 20); // -0.5 per open issue, max -20
	issueScore -= Math.min(staleIssues.length * 2, 15); // -2 per stale issue, max -15
	if (avgIssueResolutionHours > 72) issueScore -= 10; // -10 if >3 days
	if (avgIssueResolutionHours > 168) issueScore -= 10; // -10 if >1 week
	issueScore = Math.max(0, issueScore);

	// ===== 2. PR HEALTH =====
	const stalePrs = prs.filter((pr) => {
		const daysSinceCreated =
			(now - pr.createdAt.getTime()) / (1000 * 60 * 60 * 24);
		return daysSinceCreated > 30;
	});

	const mergedPrs = closedPrs.filter((pr) => pr.status === "merged");
	const prMergeRate =
		closedPrs.length > 0
			? (mergedPrs.length / closedPrs.length) * 100
			: 100;

	const avgPrReviewHours =
		mergedPrs.length > 0
			? mergedPrs.reduce((sum, pr) => {
					return sum + (pr.avgReviewTime || 0);
				}, 0) / mergedPrs.length
			: 0;

	// PR health score (0-100)
	let prScore = 100;
	prScore -= Math.min(prs.length * 1, 15); // -1 per open PR, max -15
	prScore -= Math.min(stalePrs.length * 3, 15); // -3 per stale PR, max -15
	prScore -= Math.max(0, 100 - prMergeRate) * 0.2; // Penalty for low merge rate
	if (avgPrReviewHours > 48) prScore -= 5; // -5 if >2 days
	if (avgPrReviewHours > 168) prScore -= 10; // -10 if >1 week
	prScore = Math.max(0, prScore);

	// ===== 3. DEPLOYMENT HEALTH (DORA) =====
	const successfulDeploys = deployments.filter((d) => d.status === "success");
	const failedDeploys = deployments.filter(
		(d) => d.status === "failure" || d.status === "error"
	);

	const deploymentFrequency = (successfulDeploys.length / daysWindow) * 7; // per week
	const failureRate =
		deployments.length > 0
			? (failedDeploys.length / deployments.length) * 100
			: 0;

	// Calculate MTTR (mean time to restore)
	const restorationTimes: number[] = [];
	for (let i = 0; i < deployments.length - 1; i++) {
		const current = deployments[i];
		const next = deployments[i + 1];

		if (
			(current.status === "failure" || current.status === "error") &&
			next.status === "success"
		) {
			const hours =
				(next.deployedAt!.getTime() - current.deployedAt!.getTime()) /
				(1000 * 60 * 60);
			restorationTimes.push(hours);
		}
	}
	const avgRestoreHours =
		restorationTimes.length > 0
			? restorationTimes.reduce((a, b) => a + b, 0) /
				restorationTimes.length
			: 0;

	// Deployment health score (0-100)
	let deploymentScore = 100;
	if (deploymentFrequency < 1) deploymentScore -= 15; // Less than 1/week
	if (deploymentFrequency < 0.25) deploymentScore -= 15; // Less than 1/month
	if (failureRate > 15) deploymentScore -= 15; // >15% failure
	if (failureRate > 30) deploymentScore -= 15; // >30% failure
	if (avgRestoreHours > 24) deploymentScore -= 10; // >1 day MTTR
	if (avgRestoreHours > 168) deploymentScore -= 10; // >1 week MTTR
	deploymentScore = Math.max(0, deploymentScore);

	// ===== 4. ACTIVITY HEALTH =====
	const weeklyCommits = (commits.length / daysWindow) * 7;
	const activeContributors = contributors.length;

	const staleBranches = branches.filter((branch) => {
		if (!branch.lastCommitAt) return false; // Skip branches with null lastCommitAt
		const daysSinceCommit =
			(now - branch.lastCommitAt.getTime()) / (1000 * 60 * 60 * 24);
		return (
			daysSinceCommit > 90 &&
			branch.name !== "main" &&
			branch.name !== "master"
		);
	});

	// Activity health score (0-100)
	let activityScore = 100;
	if (weeklyCommits < 5) activityScore -= 15; // Less than 5 commits/week
	if (weeklyCommits < 2) activityScore -= 15; // Less than 2 commits/week
	if (activeContributors < 2) activityScore -= 15; // Less than 2 contributors
	activityScore -= Math.min(staleBranches.length * 2, 15); // -2 per stale branch
	activityScore = Math.max(0, activityScore);

	// ===== 5. OVERALL HEALTH SCORE =====
	// Weighted average: Issues 20%, PRs 25%, Deployments 30%, Activity 25%
	const overallScore = Math.round(
		issueScore * 0.2 +
			prScore * 0.25 +
			deploymentScore * 0.3 +
			activityScore * 0.25
	);

	// Assign letter grade
	let grade: "A" | "B" | "C" | "D" | "F";
	if (overallScore >= 90) grade = "A";
	else if (overallScore >= 80) grade = "B";
	else if (overallScore >= 70) grade = "C";
	else if (overallScore >= 60) grade = "D";
	else grade = "F";

	return {
		healthScore: overallScore,
		grade,
		issueHealth: {
			score: Math.round(issueScore),
			openCount: issues.length,
			avgResolutionHours: Math.round(avgIssueResolutionHours * 10) / 10,
			staleCount: staleIssues.length,
		},
		prHealth: {
			score: Math.round(prScore),
			openCount: prs.length,
			avgReviewHours: Math.round(avgPrReviewHours * 10) / 10,
			staleCount: stalePrs.length,
			mergeRate: Math.round(prMergeRate * 10) / 10,
		},
		deploymentHealth: {
			score: Math.round(deploymentScore),
			weeklyFrequency: Math.round(deploymentFrequency * 10) / 10,
			failureRate: Math.round(failureRate * 10) / 10,
			avgRestoreHours: Math.round(avgRestoreHours * 10) / 10,
		},
		activityHealth: {
			score: Math.round(activityScore),
			weeklyCommits: Math.round(weeklyCommits * 10) / 10,
			activeContributors,
			staleBranches: staleBranches.length,
		},
	};
}
