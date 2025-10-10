/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import { prisma } from "../prisma";
import { getIntegration } from "@/server/integrations";
import { PaginatedResponse, PaginationOptions } from "@/types/connector";

// Extend Octokit with plugins for resilience against rate limits and transient errors
const OctokitWithPlugins = Octokit.plugin(retry, throttling);

// CDM-aligned interfaces for data normalization (match Prisma types)
interface CommitData {
	externalId: string; // GitHub SHA
	authorName?: string; // GitHub user name
	committerName?: string;
	avatarUrl?: string;
	committedAt: Date;
	message: string;
	additions?: number;
	deletions?: number;
	total?: number;
	url: string;
	attributes?: Record<string, any>; // Flexible JSON for extra data
}

export interface RepoData {
	externalId: string; // GitHub repository ID (stringified)
	name: string; // Repository name (e.g., "my-repo")
	fullName: string; // Full repository name (e.g., "username/my-repo")
	owner?: string | null; // Repository owner (e.g., "username")
	url: string; // Repository HTML URL (e.g., "https://github.com/username/my-repo")
	defaultBranch: string;
	openIssuesCount: number;
	visibility?: string;
	description: string | null;
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
	commitsBehind: number; // Relative to main (requires comparison)
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
	private owner?: string;
	private repo?: string;

	constructor(token: string, owner?: string, repo?: string) {
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

	async fetchRepositories(
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<RepoData>> {
		const { page = 1, limit = 50, search = "" } = options;

		try {
			let repositories: RepoData[] = [];
			let totalCount = 0;

			if (search) {
				// Use search API when search term is provided
				const { data } = await this.octokit.rest.search.repos({
					q: `${search} user:@me`,
					sort: "updated",
					order: "desc",
					per_page: limit,
					page: page,
				});

				totalCount = data.total_count;
				repositories = data.items.map((repo) => ({
					externalId: repo.id.toString(),
					name: repo.name,
					fullName: repo.full_name,
					owner: repo.owner?.name || repo.owner?.login || "",
					url: repo.html_url,
					defaultBranch: repo.default_branch || "main",
					openIssuesCount: repo.open_issues_count || 0,
					visibility: repo.visibility,
					description: repo.description || null,
				}));
			} else {
				// Use regular list endpoint for all repositories
				const { data, headers } =
					await this.octokit.rest.repos.listForAuthenticatedUser({
						sort: "updated",
						visibility: "all",
						per_page: limit,
						page: page,
					});

				// GitHub's Link header contains pagination info
				// Parse it to get total count (approximate)
				const linkHeader = headers.link;
				if (linkHeader) {
					const lastPageMatch = linkHeader.match(
						/page=(\d+)>; rel="last"/
					);
					if (lastPageMatch) {
						const lastPage = parseInt(lastPageMatch[1]);
						totalCount = lastPage * limit;
					} else {
						totalCount = data.length;
					}
				} else {
					totalCount = data.length;
				}

				repositories = data.map((repo) => ({
					externalId: repo.id.toString(),
					name: repo.name,
					fullName: repo.full_name,
					owner: repo.owner?.name || repo.owner?.login || "",
					url: repo.html_url,
					defaultBranch: repo.default_branch || "main",
					openIssuesCount: repo.open_issues_count || 0,
					visibility: repo.visibility,
					description: repo.description || null,
				}));
			}

			// Calculate pagination metadata
			const totalPages = Math.ceil(totalCount / limit);
			const hasMore = page < totalPages;

			return {
				repositories,
				page,
				limit,
				total: totalCount,
				totalPages,
				hasMore,
			};
		} catch (error) {
			console.error("GitHub fetchRepositories error:", error);
			throw new Error("Failed to fetch repositories");
		}
	}

	// Fetch commits (e.g., for activity charts and recent lists)
	async fetchCommits(since?: Date): Promise<CommitData[]> {
		try {
			const { data } = await this.octokit.rest.repos.listCommits({
				owner: this.owner!,
				repo: this.repo!,
				since: since?.toISOString(),
				per_page: 50, // MVP limit; add pagination for large repos
			});
			return data.map((commit) => ({
				url: commit.html_url,
				externalId: commit.sha,
				authorName: commit.commit.author?.name,
				committerName: commit.committer?.name || "",
				committedAt: new Date(
					commit.commit.committer?.date || Date.now()
				),
				avatarUrl: commit.committer?.avatar_url,
				additions: commit.stats?.additions,
				deletions: commit.stats?.additions,
				total: commit.stats?.total,
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
				owner: this.owner!,
				repo: this.repo!,
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
				owner: this.owner!,
				repo: this.repo!,
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
				owner: this.owner!,
				repo: this.repo!,
				per_page: 100, // MVP limit; add pagination for large repos if needed
			});

			// Fetch commitsAhead by comparing each branch to main
			const branches = await Promise.all(
				data.map(async (branch) => {
					const { data: commit } =
						await this.octokit.rest.git.getCommit({
							owner: this.owner!,
							repo: this.repo!,
							commit_sha: branch.commit.sha,
						});

					// Compare branch with main to get commitsAhead
					const compareResult =
						await this.octokit.rest.repos.compareCommits({
							owner: this.owner!,
							repo: this.repo!,
							base: "main", // Assume main as base; configurable if needed
							head: branch.name,
						});
					const commitsAhead = compareResult.data.ahead_by || 0; // Number of commits ahead of main
					const commitsBehind = compareResult.data.behind_by || 0; // Number of commits ahead of main

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
						commitsBehind,
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
				owner: this.owner!,
				repo: this.repo!,
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
	// Fetch integration
	const integration = await getIntegration(organizationId, "github");
	if (!integration?.account.accessToken) {
		throw new Error("Integration not connected");
	}

	// Fetch all repositories for the organization
	const repositories = await prisma.repository.findMany({
		where: {
			organizationId,
			sourceTool: "github",
		},
	});

	if (repositories.length === 0) {
		return; // Early return if no repositories
	}

	// Process repositories in parallel with a limit to respect API rate limits
	const syncPromises = repositories.map((repo) => async () => {
		const connector = new GitHubConnector(
			integration.account.accessToken!,
			repo.owner,
			repo.name
		);

		try {
			// Parallel fetch from GitHub
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

			// Batch upsert using Prisma transaction
			await prisma.$transaction(async (tx) => {
				// Upsert commits
				await tx.commit.createMany({
					data: commits.map((commit) => ({
						externalId: commit.externalId,
						authorName: commit.authorName,
						committerName: commit.committerName,
						avatarUrl: commit.avatarUrl,
						additions: commit.additions,
						deletions: commit.deletions,
						total: commit.total,
						url: commit.url,
						committedAt: commit.committedAt,
						message: commit.message,
						attributes: commit.attributes,
						organizationId,
						sourceTool: "github",
						repositoryId: repo.id,
					})),
					skipDuplicates: true,
				});

				// Upsert pullRequests - REMOVED externalId_sourceTool
				await tx.pullRequest.createMany({
					data: pullRequests.map((pr) => ({
						externalId: pr.externalId,
						title: pr.title,
						status: pr.status,
						authorId: pr.authorId,
						attributes: pr.attributes,
						avgReviewTime: pr.avgReviewTime,
						organizationId,
						sourceTool: "github",
						repositoryId: repo.id,
					})),
					skipDuplicates: true,
				});

				// Upsert issues - REMOVED externalId_sourceTool
				await tx.issue.createMany({
					data: issues.map((issue) => ({
						externalId: issue.externalId,
						title: issue.title,
						status: issue.status,
						authorId: issue.authorId,
						attributes: issue.attributes,
						organizationId,
						sourceTool: "github",
						repositoryId: repo.id,
					})),
					skipDuplicates: true,
				});

				// Upsert branches - REMOVED externalId_sourceTool
				await tx.branch.createMany({
					data: branches.map((branch) => ({
						externalId: branch.externalId,
						name: branch.name,
						status: branch.status,
						lastCommitAt: branch.lastCommitAt,
						commitsAhead: branch.commitsAhead,
						commitsBehind: branch.commitsBehind,
						attributes: branch.attributes,
						organizationId,
						sourceTool: "github",
						repositoryId: repo.id,
					})),
					skipDuplicates: true,
				});

				// Upsert contributors - REMOVED externalId_sourceTool
				await tx.contributor.createMany({
					data: contributors.map((contributor) => ({
						externalId: contributor.externalId,
						login: contributor.login,
						contributions: contributor.contributions,
						attributes: contributor.attributes,
						organizationId,
						sourceTool: "github",
						repositoryId: repo.id,
					})),
					skipDuplicates: true,
				});

				// Upsert repository health
				await tx.repositoryHealth.upsert({
					where: {
						organizationId_repositoryId: {
							organizationId,
							repositoryId: repo.id,
						},
					},
					update: repoHealth,
					create: {
						...repoHealth,
						organizationId,
						repositoryId: repo.id,
					},
				});
			});

			// Update lastSyncedAt outside transaction to avoid rollback issues
			await prisma.integration.update({
				where: { id: integration.id },
				data: { lastSyncAt: new Date() },
			});

			console.log(`✅ Successfully synced repo: ${repo.name}`);
		} catch (error) {
			console.error(`❌ Sync failed for repo ${repo.name}:`, error);
			// Optionally rethrow or log for retry logic
		}
	});

	// Execute syncs with a concurrency limit (e.g., 5 concurrent syncs to respect GitHub API limits)
	const concurrencyLimit = 5;
	for (let i = 0; i < syncPromises.length; i += concurrencyLimit) {
		const batch = syncPromises.slice(i, i + concurrencyLimit);
		await Promise.all(batch.map((fn) => fn()));
	}

	console.log(`✅ GitHub sync completed for organization: ${organizationId}`);
}
