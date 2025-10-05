/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/connectors/github.ts
import { Octokit } from "@octokit/rest"; // Latest: 22.0.0[](https://www.npmjs.com/package/@octokit/rest)
import { retry } from "@octokit/plugin-retry"; // Latest: 8.0.2[](https://www.npmjs.com/package/@octokit/plugin-retry)
import { throttling } from "@octokit/plugin-throttling"; // Latest: 11.0.2[](https://www.npmjs.com/package/@octokit/plugin-throttling)
import { prisma } from "../prisma";
import { getIntegration } from "@/server/integrations";

// Extend Octokit with plugins for resilience against rate limits and transient errors
const OctokitWithPlugins = Octokit.plugin(retry, throttling);

// CDM-aligned interfaces for data normalization (match Prisma types)
interface CommitData {
	externalId: string; // GitHub SHA
	authorId?: string; // GitHub user ID or email or Link to user
	committedAt: Date;
	message: string;
	attributes?: Record<string, any>; // Flexible JSON for extra data
}

interface PullRequestData {
	externalId: string; // GitHub PR ID
	title: string;
	status: string; // "open", "closed", "merged", "draft"
	reviewStatus?: string; // e.g., "awaiting_review"
	mergedAt?: Date;
	authorId?: string;
	reviewerIds?: string[];
	avgReviewTime?: number; // Hours (computed if needed)
	attributes?: Record<string, any>;
}

interface IssueData {
	externalId: string; // GitHub issue ID
	title: string;
	status: string; // "open", "closed"
	authorId?: string;
	attributes?: Record<string, any>;
}

interface BranchData {
	externalId: string; // GitHub branch name (as ID)
	name: string;
	lastCommitAt?: Date;
	status: string; // e.g., "active", "stale" (computed based on age)
	commitsAhead: number; // Relative to main (requires comparison)
	attributes?: Record<string, any>;
}

interface ContributorData {
	externalId: string; // GitHub user ID
	login: string; // GitHub username
	contributions: number; // Number of contributions
	attributes?: Record<string, any>; // Flexible JSON for extra data (e.g., avatar URL)
}

interface RepositoryHealthData {
	healthScore: number; // 0-100 computed score
	openIssues: number;
	stalePrs: number; // PRs open >30 days
	avgReviewTime: number; // Average in hours
	testCoverage?: number; // Optional, if available from external tools
}

export class GitHubConnector {
	private octokit: InstanceType<typeof OctokitWithPlugins>;
	private owner: string;
	private repo: string;

	constructor(token: string, owner: string, repo: string) {
		this.octokit = new OctokitWithPlugins({
			auth: token,
			throttle: {
				onRateLimit: (retryAfter: number) => {
					console.log(
						`Rate limit hit, retrying after ${retryAfter} seconds`
					);
					return true; // Retry once
				},
				onSecondaryRateLimit: (retryAfter: number) => {
					console.log(
						`Secondary rate limit hit, retrying after ${retryAfter} seconds`
					);
					return true;
				},
			},
			retry: { retries: 3 }, // Auto-retry on transient failures
		});
		this.owner = owner;
		this.repo = repo;
	}

	// Fetch commits (e.g., for activity charts and recent lists)
	async fetchCommits(since?: Date): Promise<CommitData[]> {
		try {
			const { data } = await this.octokit.rest.repos.listCommits({
				owner: this.owner,
				repo: this.repo,
				since: since?.toISOString(),
				per_page: 100, // MVP limit; add pagination for large repos
			});
			return data.map((commit) => ({
				externalId: commit.sha,
				authorId:
					commit.author?.id?.toString() ||
					commit.commit.author?.email ||
					"",
				committedAt: new Date(
					commit.commit.committer?.date || Date.now()
				),
				message: commit.commit.message,
				attributes: { url: commit.html_url }, // Extra for CDM Json
			}));
		} catch (error) {
			console.error("GitHub fetchCommits error:", error);
			throw new Error("Failed to fetch commits");
		}
	}

	// Fetch pull requests (e.g., for counts and statuses)
	async fetchPullRequests(
		state: "open" | "closed" | "all" = "all"
	): Promise<PullRequestData[]> {
		try {
			const { data } = await this.octokit.rest.pulls.list({
				owner: this.owner,
				repo: this.repo,
				state,
				per_page: 100,
			});
			return data.map((pr) => ({
				externalId: pr.id.toString(),
				title: pr.title,
				status:
					pr.state === "closed" && pr.merged_at ? "merged" : pr.state,
				reviewStatus: pr.draft ? "draft" : "awaiting_review", // Simplified; fetch reviews for accuracy
				mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
				authorId: pr.user?.id?.toString(),
				reviewerIds:
					pr.requested_reviewers?.map((r) => r.id.toString()) || [],
				attributes: { url: pr.html_url },
			}));
		} catch (error) {
			console.error("GitHub fetchPullRequests error:", error);
			throw new Error("Failed to fetch pull requests");
		}
	}

	// Fetch issues (e.g., for open counts in health metrics)
	async fetchIssues(
		state: "open" | "closed" | "all" = "all"
	): Promise<IssueData[]> {
		try {
			const { data } = await this.octokit.rest.issues.listForRepo({
				owner: this.owner,
				repo: this.repo,
				state,
				per_page: 100,
			});
			return data
				.filter((issue) => !issue.pull_request)
				.map((issue) => ({
					// Exclude PRs
					externalId: issue.id.toString(),
					title: issue.title,
					status: issue.state,
					authorId: issue.user?.id?.toString(),
					attributes: { url: issue.html_url },
				}));
		} catch (error) {
			console.error("GitHub fetchIssues error:", error);
			throw new Error("Failed to fetch issues");
		}
	}

	// Fetch branches (e.g., for activity lists)
	async fetchBranches(): Promise<BranchData[]> {
		try {
			const { data } = await this.octokit.rest.repos.listBranches({
				owner: this.owner,
				repo: this.repo,
				per_page: 100, // MVP limit; add pagination for large repos if needed
			});

			// Fetch commitsAhead by comparing each branch to main
			const branches = await Promise.all(
				data.map(async (branch) => {
					const { data: commit } =
						await this.octokit.rest.git.getCommit({
							owner: this.owner,
							repo: this.repo,
							commit_sha: branch.commit.sha,
						});

					// Compare branch with main to get commitsAhead
					const compareResult =
						await this.octokit.rest.repos.compareCommits({
							owner: this.owner,
							repo: this.repo,
							base: "main", // Assume main as base; configurable if needed
							head: branch.name,
						});
					const commitsAhead = compareResult.data.ahead_by || 0; // Number of commits ahead of main

					const lastCommitAt = new Date(
						commit.committer?.date || Date.now()
					);
					const status =
						Date.now() - lastCommitAt.getTime() >
						30 * 24 * 60 * 60 * 1000
							? "stale"
							: "active"; // >30 days stale

					return {
						externalId: branch.name,
						name: branch.name,
						lastCommitAt,
						status,
						commitsAhead,
						attributes: { protected: branch.protected },
					};
				})
			);

			return branches;
		} catch (error) {
			console.error("GitHub fetchBranches error:", error);
			throw new Error("Failed to fetch branches");
		}
	}

	async fetchContributors(): Promise<ContributorData[]> {
		try {
			const { data } = await this.octokit.rest.repos.listContributors({
				owner: this.owner,
				repo: this.repo,
				per_page: 100, // MVP limit; add pagination for large repos if needed
				// anon: false, // Exclude anonymous contributions
			});

			return data.map((contributor) => ({
				externalId: contributor.id!.toString(),
				login: contributor.login!,
				contributions: contributor.contributions,
				attributes: { avatarUrl: contributor.avatar_url }, // Extra data for CDM
			}));
		} catch (error) {
			console.error("GitHub fetchContributors error:", error);
			throw new Error("Failed to fetch contributors");
		}
	}

	// Compute repository health (aggregated metrics)
	async computeRepositoryHealth(): Promise<RepositoryHealthData> {
		try {
			const [issues, prs] = await Promise.all([
				this.fetchIssues("open"),
				this.fetchPullRequests("open"),
			]);
			const openIssues = issues.length;
			const stalePrs = prs.filter((pr) => {
				const openedAt = new Date(
					pr.attributes?.created_at || Date.now()
				); // Assume attributes has created_at; fetch if needed
				return (
					Date.now() - openedAt.getTime() > 30 * 24 * 60 * 60 * 1000
				); // >30 days
			}).length;
			const avgReviewTime =
				prs.reduce((sum, pr) => sum + (pr.avgReviewTime || 0), 0) /
				(prs.length || 1); // Placeholder; compute from reviews
			const healthScore = Math.max(
				0,
				100 -
					openIssues * 2 -
					stalePrs * 5 -
					(avgReviewTime > 24 ? 10 : 0)
			); // Custom formula; adjust per needs

			return {
				healthScore: Math.round(healthScore),
				openIssues,
				stalePrs,
				avgReviewTime,
				testCoverage: undefined, // Integrate with external tool (e.g., Codecov API) in future
			};
		} catch (error) {
			console.error("GitHub computeRepositoryHealth error:", error);
			throw new Error("Failed to compute repository health");
		}
	}
}

export async function syncGitHub(organizationId: string) {
	const integration = await getIntegration(organizationId, "github");

	if (!integration?.account.accessToken) {
		throw new Error("Integration not connected");
	}

	const repositories = await prisma.repository.findMany({
		where: {
			organizationId,
			sourceTool: "github",
		},
	});

	for (const repo of repositories) {
		// Instantiate connector and sync
		const connector = new GitHubConnector(
			integration?.account.accessToken,
			repo.owner,
			repo.name
		);

		const [
			commits,
			pullRequests,
			issues,
			branches,
			repoHealth,
			contributors,
		] = await Promise.all([
			connector.fetchCommits(),
			connector.fetchPullRequests(),
			connector.fetchIssues(),
			connector.fetchBranches(),
			connector.computeRepositoryHealth(),
			connector.fetchContributors(),
		]);

		// Upsert to Prisma (idempotent)
		for (const commit of commits) {
			await prisma.commit.upsert({
				where: {
					externalId_sourceTool: {
						externalId: commit.externalId,
						sourceTool: "github",
					},
				},
				update: {
					...commit,
					organizationId,
					repositoryId: repo.id,
				},
				create: {
					...commit,
					organizationId,
					sourceTool: "github",
					repositoryId: repo.id,
				},
			});
		}

		for (const pr of pullRequests) {
			await prisma.pullRequest.upsert({
				where: {
					externalId_sourceTool: {
						externalId: pr.externalId,
						sourceTool: "github",
					},
				},
				update: {
					...pr,
					organizationId,
					sourceTool: "github",
					repositoryId: repo.id,
				},
				create: {
					...pr,
					organizationId,
					sourceTool: "github",
					repositoryId: repo.id,
				},
			});
		}

		for (const issue of issues) {
			await prisma.issue.upsert({
				where: {
					externalId_sourceTool: {
						externalId: issue.externalId,
						sourceTool: "github",
					},
				},
				update: {
					...issue,
					organizationId,
					sourceTool: "github",
					repositoryId: repo.id,
				},
				create: {
					...issue,
					organizationId,
					sourceTool: "github",
					repositoryId: repo.id,
				},
			});
		}

		for (const branch of branches) {
			await prisma.branch.upsert({
				where: {
					externalId_sourceTool: {
						externalId: branch.externalId,
						sourceTool: "github",
					},
				},
				update: {
					...branch,
					organizationId,
					sourceTool: "github",
					repositoryId: repo.id,
				},
				create: {
					...branch,
					organizationId,
					sourceTool: "github",
					repositoryId: repo.id,
				},
			});
		}

		for (const contributor of contributors) {
			await prisma.contributor.upsert({
				where: {
					externalId_sourceTool: {
						externalId: contributor.externalId,
						sourceTool: "github",
					},
				},
				update: {
					...contributor,
					organizationId,
					sourceTool: "github",
					repositoryId: repo.id,
				},
				create: {
					...contributor,
					organizationId,
					sourceTool: "github",
					repositoryId: repo.id,
				},
			});
		}

		await prisma.repositoryHealth.upsert({
			where: {
				organizationId_repositoryId: {
					repositoryId: repo.id,
					organizationId,
				},
			},
			update: {
				...repoHealth,
			},
			create: {
				...repoHealth,
				organizationId,
				repositoryId: repo.id,
			},
		});

		// Update lastSyncedAt
		await prisma.integration.update({
			where: { id: integration.id },
			data: { lastSyncAt: new Date() },
		});
	}
}
