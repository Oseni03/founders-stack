/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import { prisma } from "../prisma";
import { getIntegration } from "@/server/integrations";
import { PaginatedResponse, PaginationOptions } from "@/types/connector";
import { Repository } from "@prisma/client";

// Extend Octokit with plugins for resilience against rate limits and transient errors
const OctokitWithPlugins = Octokit.plugin(retry, throttling);

// ============================================================================
// UPDATED INTERFACES BASED ON NEW SCHEMA
// ============================================================================

interface CommitData {
	externalId: string; // SHA
	sha: string; // Same as externalId, but explicit
	branch?: string;
	authorName?: string;
	authorEmail?: string;
	committerName?: string;
	avatarUrl?: string;
	committerEmail?: string;
	committedAt: Date;
	message: string;
	additions?: number;
	deletions?: number;
	total?: number;
	url: string;
	attributes?: Record<string, any>;
}

export interface RepoData {
	externalId: string;
	name: string;
	fullName: string;
	owner: string;
	url: string;
	description: string | null;
	defaultBranch: string;
	language: string | null;
	isPrivate: boolean;
	isArchived: boolean;
	openIssuesCount: number;
	forksCount: number;
	stargazersCount: number;
	attributes?: Record<string, any>;
}

interface PullRequestData {
	externalId: string;
	number: number;
	title: string;
	body: string | null;
	url: string;
	status: string; // "open", "closed", "merged", "draft"
	reviewStatus?: string;
	isDraft: boolean;
	baseBranch: string;
	headBranch: string;
	authorId?: string;
	authorLogin?: string;
	reviewerIds: string[];
	createdAt: Date;
	mergedAt?: Date;
	closedAt?: Date;
	avgReviewTime?: number;
	attributes?: Record<string, any>;
}

interface IssueData {
	externalId: string;
	number: number;
	title: string;
	body: string | null;
	url: string;
	status: string; // "open", "closed"
	authorId?: string;
	authorLogin?: string;
	assigneeIds: string[];
	labels: string[];
	commentsCount: number;
	createdAt: Date;
	closedAt?: Date;
	attributes?: Record<string, any>;
}

interface BranchData {
	externalId: string;
	name: string;
	sha: string;
	isProtected: boolean;
	createdBy?: string;
	status: string; // "active", "stale"
	lastCommitAt?: Date;
	commitsAhead: number;
	commitsBehind: number;
	attributes?: Record<string, any>;
}

interface ContributorData {
	externalId: string;
	login: string;
	name?: string;
	email?: string;
	avatarUrl?: string;
	contributions: number;
	lastContributedAt?: Date;
	attributes?: Record<string, any>;
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
					return true;
				},
				onSecondaryRateLimit: (retryAfter: number) => {
					console.log(
						`Secondary rate limit hit, retrying after ${retryAfter} seconds`
					);
					return true;
				},
			},
			retry: { retries: 3 },
		});
		this.owner = owner;
		this.repo = repo;
	}

	// ========================================================================
	// REPOSITORY METHODS
	// ========================================================================

	async fetchRepositories(
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<RepoData>> {
		const { page = 1, limit = 50, search = "" } = options;

		try {
			let repositories: RepoData[] = [];
			let totalCount = 0;

			if (search) {
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
					owner: repo.owner?.login || "",
					description: repo.description || null,
					url: repo.html_url,
					defaultBranch: repo.default_branch || "main",
					language: repo.language || null,
					isPrivate: repo.private || false,
					isArchived: repo.archived || false,
					openIssuesCount: repo.open_issues_count || 0,
					forksCount: repo.forks_count || 0,
					stargazersCount: repo.stargazers_count || 0,
					attributes: {
						visibility: repo.visibility,
						size: repo.size,
						created_at: repo.created_at,
						updated_at: repo.updated_at,
						pushed_at: repo.pushed_at,
						has_issues: repo.has_issues,
						has_projects: repo.has_projects,
						has_wiki: repo.has_wiki,
						topics: repo.topics,
					},
				}));
			} else {
				const { data, headers } =
					await this.octokit.rest.repos.listForAuthenticatedUser({
						sort: "updated",
						visibility: "all",
						per_page: limit,
						page: page,
					});

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
					owner: repo.owner?.login || "",
					description: repo.description || null,
					url: repo.html_url,
					defaultBranch: repo.default_branch || "main",
					language: repo.language || null,
					isPrivate: repo.private || false,
					isArchived: repo.archived || false,
					openIssuesCount: repo.open_issues_count || 0,
					forksCount: repo.forks_count || 0,
					stargazersCount: repo.stargazers_count || 0,
					attributes: {
						visibility: repo.visibility,
						size: repo.size,
						created_at: repo.created_at,
						updated_at: repo.updated_at,
						pushed_at: repo.pushed_at,
						has_issues: repo.has_issues,
						has_projects: repo.has_projects,
						has_wiki: repo.has_wiki,
						topics: repo.topics,
					},
				}));
			}

			const totalPages = Math.ceil(totalCount / limit);
			const hasMore = page < totalPages;

			return {
				resources: repositories,
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

	async fetchSingleRepository(): Promise<RepoData> {
		try {
			const { data } = await this.octokit.rest.repos.get({
				owner: this.owner!,
				repo: this.repo!,
			});

			return {
				externalId: data.id.toString(),
				name: data.name,
				fullName: data.full_name,
				owner: data.owner?.login || "",
				description: data.description || null,
				url: data.html_url,
				defaultBranch: data.default_branch || "main",
				language: data.language || null,
				isPrivate: data.private || false,
				isArchived: data.archived || false,
				openIssuesCount: data.open_issues_count || 0,
				forksCount: data.forks_count || 0,
				stargazersCount: data.stargazers_count || 0,
				attributes: {
					visibility: data.visibility,
					size: data.size,
					created_at: data.created_at,
					updated_at: data.updated_at,
					pushed_at: data.pushed_at,
					has_issues: data.has_issues,
					has_projects: data.has_projects,
					has_wiki: data.has_wiki,
					topics: data.topics,
					watchers_count: data.watchers_count,
					network_count: data.network_count,
				},
			};
		} catch (error) {
			console.error("GitHub fetchSingleRepository error:", error);
			throw new Error("Failed to fetch repository");
		}
	}

	// ========================================================================
	// COMMIT METHODS
	// ========================================================================

	async fetchCommits(since?: Date, branch?: string): Promise<CommitData[]> {
		try {
			const params: any = {
				owner: this.owner!,
				repo: this.repo!,
				per_page: 100,
			};

			if (since) {
				params.since = since.toISOString();
			}

			if (branch) {
				params.sha = branch;
			}

			const { data } = await this.octokit.rest.repos.listCommits(params);

			return data.map((commit) => ({
				externalId: commit.sha,
				sha: commit.sha,
				branch: branch,
				authorName: commit.commit.author?.name || commit.author?.login,
				authorEmail: commit.commit.author?.email,
				committerName:
					commit.commit.committer?.name || commit.committer?.login,
				committerEmail: commit.commit.committer?.email,
				avatarUrl:
					commit.author?.avatar_url || commit.committer?.avatar_url,
				message: commit.commit.message,
				committedAt: new Date(
					commit.commit.committer?.date || Date.now()
				),
				url: commit.html_url,
				additions: commit.stats?.additions,
				deletions: commit.stats?.deletions,
				total: commit.stats?.total,
				attributes: {
					tree_sha: commit.commit.tree.sha,
					parents: commit.parents?.map((p) => p.sha),
					verified: commit.commit.verification?.verified,
					files_changed: commit.files?.length,
				},
			}));
		} catch (error) {
			console.error("GitHub fetchCommits error:", error);
			throw new Error("Failed to fetch commits");
		}
	}

	async fetchSingleCommit(sha: string): Promise<CommitData> {
		try {
			const { data } = await this.octokit.rest.repos.getCommit({
				owner: this.owner!,
				repo: this.repo!,
				ref: sha,
			});

			return {
				externalId: data.sha,
				sha: data.sha,
				authorName: data.commit.author?.name || data.author?.login,
				authorEmail: data.commit.author?.email,
				committerName:
					data.commit.committer?.name || data.committer?.login,
				committerEmail: data.commit.committer?.email,
				avatarUrl:
					data.author?.avatar_url || data.committer?.avatar_url,
				message: data.commit.message,
				committedAt: new Date(
					data.commit.committer?.date || Date.now()
				),
				url: data.html_url,
				additions: data.stats?.additions,
				deletions: data.stats?.deletions,
				total: data.stats?.total,
				attributes: {
					tree_sha: data.commit.tree.sha,
					parents: data.parents?.map((p) => p.sha),
					verified: data.commit.verification?.verified,
					files: data.files?.map((f) => ({
						filename: f.filename,
						status: f.status,
						additions: f.additions,
						deletions: f.deletions,
						changes: f.changes,
					})),
				},
			};
		} catch (error) {
			console.error("GitHub fetchSingleCommit error:", error);
			throw new Error("Failed to fetch commit");
		}
	}

	// ========================================================================
	// PULL REQUEST METHODS
	// ========================================================================

	async fetchPullRequests(
		state: "open" | "closed" | "all" = "all"
	): Promise<PullRequestData[]> {
		try {
			const { data } = await this.octokit.rest.pulls.list({
				owner: this.owner!,
				repo: this.repo!,
				state,
				per_page: 100,
				sort: "updated",
				direction: "desc",
			});

			return data.map((pr) => {
				const status = pr.draft
					? "draft"
					: pr.state === "closed" && pr.merged_at
						? "merged"
						: pr.state;

				const reviewStatus = pr.draft
					? "draft"
					: pr.requested_reviewers &&
						  pr.requested_reviewers.length > 0
						? "awaiting_review"
						: pr.state === "open"
							? "in_review"
							: null;

				// Calculate review time if merged
				let avgReviewTime: number | undefined;
				if (pr.merged_at && pr.created_at) {
					const created = new Date(pr.created_at).getTime();
					const merged = new Date(pr.merged_at).getTime();
					avgReviewTime = (merged - created) / (1000 * 60 * 60); // Hours
				}

				return {
					externalId: `${pr.id}`,
					number: pr.number,
					title: pr.title,
					body: pr.body || null,
					url: pr.html_url,
					status,
					reviewStatus: reviewStatus || undefined,
					isDraft: pr.draft || false,
					baseBranch: pr.base.ref,
					headBranch: pr.head.ref,
					authorId: pr.user?.id?.toString(),
					authorLogin: pr.user?.login,
					reviewerIds:
						pr.requested_reviewers?.map((r) => r.id.toString()) ||
						[],

					createdAt: new Date(pr.created_at),
					mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
					closedAt: pr.closed_at ? new Date(pr.closed_at) : undefined,
					avgReviewTime,
					attributes: {
						state: pr.state,
						locked: pr.locked,
						merged: pr.merged_at ? true : false,
						assignees: pr.assignees?.map((a) => a.login),
						labels: pr.labels?.map((l) => l.name),
						milestone: pr.milestone?.title,
					},
				};
			});
		} catch (error) {
			console.error("GitHub fetchPullRequests error:", error);
			throw new Error("Failed to fetch pull requests");
		}
	}

	// ========================================================================
	// ISSUE METHODS
	// ========================================================================

	async fetchIssues(
		state: "open" | "closed" | "all" = "all"
	): Promise<IssueData[]> {
		try {
			const { data } = await this.octokit.rest.issues.listForRepo({
				owner: this.owner!,
				repo: this.repo!,
				state,
				per_page: 100,
				sort: "updated",
				direction: "desc",
			});

			// Filter out pull requests (GitHub API returns PRs as issues)
			return data
				.filter((issue) => !issue.pull_request)
				.map((issue) => ({
					externalId: issue.id.toString(),
					number: issue.number,
					title: issue.title,
					body: issue.body || null,
					url: issue.html_url,
					status: issue.state,
					authorId: issue.user?.id?.toString(),
					authorLogin: issue.user?.login,
					assigneeIds:
						issue.assignees?.map((a) => a.id.toString()) || [],
					labels:
						issue.labels
							?.map((l) => (typeof l === "string" ? l : l.name))
							.filter(
								(name): name is string => name !== undefined
							) || [],
					commentsCount: issue.comments || 0,
					createdAt: new Date(issue.created_at),
					closedAt: issue.closed_at
						? new Date(issue.closed_at)
						: undefined,
					attributes: {
						state_reason: issue.state_reason,
						locked: issue.locked,
						milestone: issue.milestone?.title,
						assignees_logins: issue.assignees?.map((a) => a.login),
						reactions: {
							total: issue.reactions?.total_count,
							plus_one: issue.reactions?.["+1"],
							minus_one: issue.reactions?.["-1"],
							laugh: issue.reactions?.laugh,
							confused: issue.reactions?.confused,
							heart: issue.reactions?.heart,
							hooray: issue.reactions?.hooray,
							eyes: issue.reactions?.eyes,
							rocket: issue.reactions?.rocket,
						},
					},
				}));
		} catch (error) {
			console.error("GitHub fetchIssues error:", error);
			throw new Error("Failed to fetch issues");
		}
	}

	// ========================================================================
	// BRANCH METHODS
	// ========================================================================

	async fetchBranches(): Promise<BranchData[]> {
		try {
			const { data } = await this.octokit.rest.repos.listBranches({
				owner: this.owner!,
				repo: this.repo!,
				per_page: 100,
			});

			// Get default branch for comparison
			const repo = await this.fetchSingleRepository();
			const defaultBranch = repo.defaultBranch;

			const branches = await Promise.all(
				data.map(async (branch) => {
					try {
						// Get commit details
						const { data: commit } =
							await this.octokit.rest.git.getCommit({
								owner: this.owner!,
								repo: this.repo!,
								commit_sha: branch.commit.sha,
							});

						// Compare with default branch
						let commitsAhead = 0;
						let commitsBehind = 0;

						if (branch.name !== defaultBranch) {
							try {
								const compareResult =
									await this.octokit.rest.repos.compareCommits(
										{
											owner: this.owner!,
											repo: this.repo!,
											base: defaultBranch,
											head: branch.name,
										}
									);
								commitsAhead = compareResult.data.ahead_by || 0;
								commitsBehind =
									compareResult.data.behind_by || 0;
							} catch (compareError) {
								console.warn(
									`Could not compare ${branch.name} with ${defaultBranch}:`,
									compareError
								);
							}
						}

						const lastCommitAt = new Date(
							commit.committer?.date || Date.now()
						);

						// Determine if branch is stale (>30 days old)
						const daysSinceLastCommit =
							(Date.now() - lastCommitAt.getTime()) /
							(1000 * 60 * 60 * 24);
						const status =
							daysSinceLastCommit > 30 ? "stale" : "active";

						return {
							externalId: `${branch.name}`,
							name: branch.name,
							sha: branch.commit.sha,
							isProtected: branch.protected || false,
							createdBy: commit.author?.name,
							status,
							lastCommitAt,
							commitsAhead,
							commitsBehind,
							attributes: {
								protected: branch.protected,
								commit_url: branch.commit.url,
							},
						};
					} catch (error) {
						console.error(
							`Error fetching details for branch ${branch.name}:`,
							error
						);
						return {
							externalId: `${branch.name}`,
							name: branch.name,
							sha: branch.commit.sha,
							isProtected: branch.protected || false,
							status: "active",
							lastCommitAt: new Date(),
							commitsAhead: 0,
							commitsBehind: 0,
							attributes: {
								protected: branch.protected,
								commit_url: branch.commit.url,
							},
						};
					}
				})
			);

			return branches;
		} catch (error) {
			console.error("GitHub fetchBranches error:", error);
			throw new Error("Failed to fetch branches");
		}
	}

	// ========================================================================
	// CONTRIBUTOR METHODS
	// ========================================================================

	async fetchContributors(): Promise<ContributorData[]> {
		try {
			const { data } = await this.octokit.rest.repos.listContributors({
				owner: this.owner!,
				repo: this.repo!,
				per_page: 100,
			});

			// Fetch detailed info for each contributor
			const contributors = await Promise.all(
				data.map(async (contributor) => {
					let name: string | undefined;
					let email: string | undefined;
					let lastContributedAt: Date | undefined;

					// Try to get more details from user endpoint
					if (contributor.login) {
						try {
							const { data: userDetails } =
								await this.octokit.rest.users.getByUsername({
									username: contributor.login,
								});
							name = userDetails.name || undefined;
							email = userDetails.email || undefined;
						} catch (error) {
							// User details not available
							console.error(
								"GitHub fetchContributors user detail error:",
								error
							);
							throw new Error(
								"Failed to fetch contributor detail"
							);
						}
					}

					// Try to get last contribution date from commits
					try {
						const { data: commits } =
							await this.octokit.rest.repos.listCommits({
								owner: this.owner!,
								repo: this.repo!,
								author: contributor.login,
								per_page: 1,
							});

						if (commits.length > 0) {
							lastContributedAt = new Date(
								commits[0].commit.committer?.date || Date.now()
							);
						}
					} catch (error) {
						// Could not fetch commits
						console.error(
							"GitHub fetchContributor commits fetching error:",
							error
						);
						throw new Error("Failed to fetch contributors commits");
					}

					return {
						externalId:
							contributor.id?.toString() || contributor.login!,
						login: contributor.login!,
						name,
						email,
						avatarUrl: contributor.avatar_url,
						contributions: contributor.contributions,
						lastContributedAt,
						attributes: {
							type: contributor.type,
							site_admin: contributor.site_admin,
							html_url: contributor.html_url,
						},
					};
				})
			);

			return contributors;
		} catch (error) {
			console.error("GitHub fetchContributors error:", error);
			throw new Error("Failed to fetch contributors");
		}
	}

	// ========================================================================
	// REPOSITORY HEALTH
	// ========================================================================

	async computeRepositoryHealth(): Promise<RepositoryHealthData> {
		try {
			const [issues, prs] = await Promise.all([
				this.fetchIssues("open"),
				this.fetchPullRequests("open"),
			]);

			const openIssues = issues.length;

			// Count stale PRs (open for >30 days)
			const stalePrs = prs.filter((pr) => {
				const daysSinceCreated =
					(Date.now() - pr.createdAt.getTime()) /
					(1000 * 60 * 60 * 24);
				return daysSinceCreated > 30;
			}).length;

			// Calculate average review time from merged PRs
			const mergedPrs = prs.filter((pr) => pr.avgReviewTime);
			const avgReviewTime =
				mergedPrs.length > 0
					? mergedPrs.reduce(
							(sum, pr) => sum + (pr.avgReviewTime || 0),
							0
						) / mergedPrs.length
					: 0;

			// Calculate health score (0-100)
			// Formula: Start at 100, subtract penalties
			let healthScore = 100;
			healthScore -= openIssues * 1; // -1 per open issue
			healthScore -= stalePrs * 5; // -5 per stale PR
			if (avgReviewTime > 48) healthScore -= 10; // -10 if avg review time > 2 days
			if (avgReviewTime > 168) healthScore -= 20; // -20 if avg review time > 1 week

			healthScore = Math.max(0, Math.min(100, healthScore)); // Clamp to 0-100

			return {
				healthScore: Math.round(healthScore),
				openIssues,
				stalePrs,
				avgReviewTime: Math.round(avgReviewTime * 10) / 10, // Round to 1 decimal
				testCoverage: undefined, // Can be integrated with Codecov, Coveralls, etc.
			};
		} catch (error) {
			console.error("GitHub computeRepositoryHealth error:", error);
			throw new Error("Failed to compute repository health");
		}
	}

	// ========================================================================
	// UTILITY METHODS
	// ========================================================================

	setRepository(owner: string, repo: string) {
		this.owner = owner;
		this.repo = repo;
	}

	getRepository() {
		return { owner: this.owner, repo: this.repo };
	}
}

export async function syncGitHub(
	organizationId: string,
	repos: Repository[] = []
) {
	// Fetch integration
	const integration = await getIntegration(organizationId, "github");
	if (!integration?.account.accessToken) {
		throw new Error("Integration not connected");
	}

	// Fetch all repositories for the organization
	let repositories;
	if (repos.length === 0) {
		repositories = await prisma.repository.findMany({
			where: {
				organizationId,
				sourceTool: "github",
			},
		});
	} else {
		repositories = repos;
	}

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
						sha: commit.sha,
						branch: commit.branch,
						authorEmail: commit.authorEmail,
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
						number: pr.number,
						url: pr.url,
						baseBranch: pr.baseBranch,
						headBranch: pr.headBranch,
						isDraft: pr.isDraft,
						createdAt: pr.createdAt,
						closedAt: pr.closedAt,
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
						number: issue.number,
						url: issue.url,
						body: issue.body,
						labels: issue.labels,
						assigneeIds: issue.assigneeIds,
						commentsCount: issue.commentsCount,
						createdAt: issue.createdAt,
						closedAt: issue.closedAt,
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
						sha: branch.sha,
						isProtected: branch.isProtected,
						attributes: branch.attributes,
						createdBy: branch.createdBy,
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
						name: contributor.name,
						email: contributor.email,
						avatarUrl: contributor.avatarUrl,
						lastContributedAt: contributor.lastContributedAt,
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

// Main event processor
export async function processGitHubEvent(event: string, payload: any) {
	console.log("Processing GitHub event:", event);

	const repository = await prisma.repository.findUnique({
		where: {
			externalId_sourceTool: {
				externalId: payload.repository?.id?.toString(),
				sourceTool: "github",
			},
		},
	});

	if (!repository) {
		console.log(
			"Repository not registered:",
			payload.repository?.full_name
		);
		return;
	}

	switch (event) {
		// Repository events
		case "repository":
			await handleRepositoryEvent(payload, repository);
			break;

		// Branch events
		case "create":
			await handleCreateEvent(payload, repository);
			break;

		case "delete":
			await handleDeleteEvent(payload, repository);
			break;

		// Push events (commits)
		case "push":
			await handlePushEvent(payload, repository);
			break;

		// Pull request events
		case "pull_request":
			await handlePullRequestEvent(payload, repository);
			break;

		// Issue events
		case "issues":
			await handleIssuesEvent(payload, repository);
			break;

		// Deployment events
		case "deployment":
			await handleDeploymentEvent(payload, repository);
			break;

		case "deployment_status":
			await handleDeploymentStatusEvent(payload);
			break;

		// Member/Contributor events
		case "member":
			await handleMemberEvent(payload, repository);
			break;

		default:
			console.log("Unhandled GitHub event:", event);
	}
}

// ============================================================================
// REPOSITORY EVENTS
// ============================================================================
// Helper function to safely convert Json to object
function jsonToObject(json: any): Record<string, any> {
	if (!json) return {};
	if (typeof json === "object" && !Array.isArray(json)) {
		return json as Record<string, any>;
	}
	return {};
}

// ============================================================================
// REPOSITORY EVENTS
// ============================================================================

async function handleRepositoryEvent(payload: any, repo: Repository) {
	const action = payload.action;
	const repository = payload.repository;

	console.log("Repository event:", action, repository.full_name);

	switch (action) {
		case "deleted":
			await prisma.repository.delete({
				where: { id: repo.id },
			});
			break;

		case "archived":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					isArchived: true, // ✅ Now a main field
					attributes: {
						...jsonToObject(repo.attributes),
						archived_at: new Date().toISOString(),
					},
				},
			});
			break;

		case "unarchived":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					isArchived: false, // ✅ Now a main field
					attributes: {
						...jsonToObject(repo.attributes),
						unarchived_at: new Date().toISOString(),
					},
				},
			});
			break;

		case "edited":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					name: repository.name,
					fullName: repository.full_name, // ✅ Now a main field
					description: repository.description, // ✅ Already a main field
					isPrivate: repository.private, // ✅ Now a main field
					language: repository.language || null, // ✅ Now a main field
					defaultBranch: repository.default_branch, // ✅ Now a main field
					attributes: {
						...jsonToObject(repo.attributes),
						edited_at: new Date().toISOString(),
					},
				},
			});
			break;

		case "transferred":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					owner: repository.owner.login, // ✅ Already a main field
					attributes: {
						...jsonToObject(repo.attributes),
						transferred: true,
						transferred_at: new Date().toISOString(),
						previous_owner: payload.changes?.owner?.from?.login,
					},
				},
			});
			break;

		case "renamed":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					name: repository.name,
					fullName: repository.full_name, // ✅ Now a main field
					attributes: {
						...jsonToObject(repo.attributes),
						renamed_at: new Date().toISOString(),
						previous_name: payload.changes?.repository?.name?.from,
					},
				},
			});
			break;
	}
}

// ============================================================================
// BRANCH EVENTS
// ============================================================================

async function handleCreateEvent(payload: any, repo: Repository) {
	const refType = payload.ref_type;
	const ref = payload.ref;

	console.log("Create event:", refType, ref);

	if (refType === "branch") {
		// Create branch record
		await prisma.branch.create({
			data: {
				organizationId: repo.organizationId,
				repositoryId: repo.id,
				externalId: ref, // Branch name as externalId
				sourceTool: "github",
				name: ref,
				status: "active",
				lastCommitAt: new Date(),
				createdBy: payload.sender?.login, // ✅ Now a main field
				isProtected: false, // ✅ Now a main field, default to false
				attributes: {
					pusher_type: payload.pusher_type,
					created_at: new Date().toISOString(),
				},
			},
		});
	}
}

async function handleDeleteEvent(payload: any, repo: Repository) {
	const refType = payload.ref_type;
	const ref = payload.ref;

	console.log("Delete event:", refType, ref);

	if (refType === "branch") {
		// Delete branch
		const branch = await prisma.branch.findFirst({
			where: {
				repositoryId: repo.id,
				name: ref,
				sourceTool: "github",
			},
		});

		if (branch) {
			await prisma.branch.delete({
				where: { id: branch.id },
			});
		}
	}
}

// ============================================================================
// PUSH EVENTS (COMMITS)
// ============================================================================

async function handlePushEvent(payload: any, repo: Repository) {
	const commits = payload.commits || [];
	const ref = payload.ref;
	const branch = ref.replace("refs/heads/", "");

	console.log(
		"Push event:",
		payload.repository.full_name,
		branch,
		commits.length,
		"commits"
	);

	// Update or create branch
	const existingBranch = await prisma.branch.findFirst({
		where: {
			repositoryId: repo.id,
			name: branch,
			sourceTool: "github",
		},
	});

	if (existingBranch) {
		await prisma.branch.update({
			where: { id: existingBranch.id },
			data: {
				lastCommitAt: new Date(),
				status: "active",
				sha: payload.head_commit?.id, // ✅ Now a main field
			},
		});
	} else {
		await prisma.branch.create({
			data: {
				organizationId: repo.organizationId,
				repositoryId: repo.id,
				externalId: branch,
				sourceTool: "github",
				name: branch,
				status: "active",
				lastCommitAt: new Date(),
				sha: payload.head_commit?.id, // ✅ Now a main field
				isProtected: false, // ✅ Default value
			},
		});
	}

	// Create commits
	for (const commit of commits) {
		// Check if commit already exists
		const existingCommit = await prisma.commit.findUnique({
			where: {
				externalId_sourceTool: {
					externalId: commit.id,
					sourceTool: "github",
				},
			},
		});

		if (!existingCommit) {
			await prisma.commit.create({
				data: {
					organizationId: repo.organizationId,
					repositoryId: repo.id,
					externalId: commit.id,
					sourceTool: "github",
					sha: commit.id, // ✅ Now a main field (same as externalId)
					branch: branch, // ✅ Now a main field
					authorName: commit.author?.name || commit.author?.username,
					authorEmail: commit.author?.email, // ✅ Now a main field
					committerName:
						commit.committer?.name || commit.committer?.username,
					message: commit.message,
					committedAt: new Date(commit.timestamp),
					url: commit.url,
					additions: commit.added?.length,
					deletions: commit.removed?.length,
					total:
						(commit.added?.length || 0) +
						(commit.removed?.length || 0) +
						(commit.modified?.length || 0),
					attributes: {
						added_files: commit.added,
						removed_files: commit.removed,
						modified_files: commit.modified,
						distinct: commit.distinct,
					},
				},
			});

			// Update or create contributor
			if (commit.author?.username) {
				await upsertContributor({
					organizationId: repo.organizationId,
					repositoryId: repo.id,
					externalId: commit.author.username, // Use username if no ID
					sourceTool: "github",
					login: commit.author.username,
					name: commit.author.name,
					email: commit.author.email,
					contributions: 1,
					lastContributedAt: new Date(commit.timestamp),
				});
			}
		}
	}
}

// ============================================================================
// PULL REQUEST EVENTS
// ============================================================================

async function handlePullRequestEvent(payload: any, repo: Repository) {
	const action = payload.action;
	const pullRequest = payload.pull_request;

	console.log("Pull request event:", action, pullRequest.number);

	// Map PR state to status
	const getStatus = () => {
		if (pullRequest.merged) return "merged";
		if (pullRequest.draft) return "draft";
		return pullRequest.state; // open, closed
	};

	// Get review status
	const getReviewStatus = () => {
		if (pullRequest.draft) return "draft";
		if (pullRequest.requested_reviewers?.length > 0) {
			return "awaiting_review";
		}
		if (pullRequest.state === "open") return "in_review";
		return null;
	};

	const prExternalId = pullRequest.id.toString();

	// Check if PR already exists
	const existingPR = await prisma.pullRequest.findUnique({
		where: {
			externalId_sourceTool: {
				externalId: prExternalId,
				sourceTool: "github",
			},
		},
	});

	// Calculate average review time if merged
	let avgReviewTime = null;
	if (pullRequest.merged_at && pullRequest.created_at) {
		const created = new Date(pullRequest.created_at).getTime();
		const merged = new Date(pullRequest.merged_at).getTime();
		avgReviewTime = (merged - created) / (1000 * 60 * 60); // Convert to hours
	}

	const prData = {
		title: pullRequest.title,
		number: pullRequest.number, // ✅ Now a main field
		body: pullRequest.body || null, // ✅ Now a main field
		url: pullRequest.html_url, // ✅ Now a main field
		status: getStatus(),
		reviewStatus: getReviewStatus(),
		isDraft: pullRequest.draft || false, // ✅ Now a main field
		baseBranch: pullRequest.base?.ref, // ✅ Now a main field
		headBranch: pullRequest.head?.ref, // ✅ Now a main field
		authorId: pullRequest.user?.login, // Using login as ID
		authorLogin: pullRequest.user?.login, // ✅ Now a main field
		reviewerIds:
			pullRequest.requested_reviewers?.map((r: any) => r.login) || [],
		additions: pullRequest.additions, // ✅ Now a main field
		deletions: pullRequest.deletions, // ✅ Now a main field
		changedFiles: pullRequest.changed_files, // ✅ Now a main field
		commitsCount: pullRequest.commits, // ✅ Now a main field
		createdAt: new Date(pullRequest.created_at), // ✅ Now a main field
		mergedAt: pullRequest.merged_at
			? new Date(pullRequest.merged_at)
			: null,
		closedAt: pullRequest.closed_at
			? new Date(pullRequest.closed_at)
			: null, // ✅ Now a main field
		avgReviewTime,
		attributes: {
			state: pullRequest.state,
			merged: pullRequest.merged,
			mergeable: pullRequest.mergeable,
			mergeable_state: pullRequest.mergeable_state,
			assignees: pullRequest.assignees?.map((a: any) => a.login),
			labels: pullRequest.labels?.map((l: any) => l.name),
			milestone: pullRequest.milestone?.title,
			comments: pullRequest.comments,
			review_comments: pullRequest.review_comments,
			maintainer_can_modify: pullRequest.maintainer_can_modify,
		},
	};

	if (existingPR) {
		// Update existing PR
		await prisma.pullRequest.update({
			where: { id: existingPR.id },
			data: prData,
		});
	} else {
		// Create new PR
		await prisma.pullRequest.create({
			data: {
				organizationId: repo.organizationId,
				repositoryId: repo.id,
				externalId: prExternalId,
				sourceTool: "github",
				...prData,
			},
		});
	}

	// Update contributor
	if (pullRequest.user?.login) {
		await upsertContributor({
			organizationId: repo.organizationId,
			repositoryId: repo.id,
			externalId:
				pullRequest.user.id?.toString() || pullRequest.user.login,
			sourceTool: "github",
			login: pullRequest.user.login,
			name: pullRequest.user.name,
			avatarUrl: pullRequest.user.avatar_url,
			contributions: 1,
			lastContributedAt: new Date(),
		});
	}
}

async function handlePullRequestReviewEvent(payload: any, repo: Repository) {
	const review = payload.review;
	const pullRequest = payload.pull_request;

	console.log("PR review event:", review.state, pullRequest.number);

	// Update contributor for reviewer
	if (review.user?.login) {
		await upsertContributor({
			organizationId: repo.organizationId,
			repositoryId: repo.id,
			externalId: review.user.id?.toString() || review.user.login,
			sourceTool: "github",
			login: review.user.login,
			name: review.user.name,
			avatarUrl: review.user.avatar_url,
			contributions: 1,
			lastContributedAt: new Date(),
		});
	}
}

async function handlePullRequestReviewCommentEvent(
	payload: any,
	repo: Repository
) {
	const comment = payload.comment;
	const pullRequest = payload.pull_request;

	console.log("PR review comment:", pullRequest.number);

	// Update contributor for commenter
	if (comment.user?.login) {
		await upsertContributor({
			organizationId: repo.organizationId,
			repositoryId: repo.id,
			externalId: comment.user.id?.toString() || comment.user.login,
			sourceTool: "github",
			login: comment.user.login,
			name: comment.user.name,
			avatarUrl: comment.user.avatar_url,
			contributions: 1,
			lastContributedAt: new Date(),
		});
	}
}

// ============================================================================
// ISSUE EVENTS
// ============================================================================

async function handleIssuesEvent(payload: any, repo: Repository) {
	const action = payload.action;
	const issue = payload.issue;

	console.log("Issue event:", action, issue.number);

	// Map issue state to status
	const getStatus = () => {
		if (issue.state === "closed") {
			return issue.state_reason === "completed" ? "closed" : "cancelled";
		}
		return "open";
	};

	const issueExternalId = issue.id.toString();

	// Check if issue already exists
	const existingIssue = await prisma.issue.findUnique({
		where: {
			externalId_sourceTool: {
				externalId: issueExternalId,
				sourceTool: "github",
			},
		},
	});

	const issueData = {
		title: issue.title,
		number: issue.number, // ✅ Now a main field
		body: issue.body || null, // ✅ Now a main field
		url: issue.html_url, // ✅ Now a main field
		status: getStatus(),
		authorId: issue.user?.login,
		authorLogin: issue.user?.login, // ✅ Now a main field
		assigneeIds: issue.assignees?.map((a: any) => a.login) || [], // ✅ Now a main field
		labels:
			issue.labels?.map((l: any) =>
				typeof l === "string" ? l : l.name
			) || [], // ✅ Now a main field
		commentsCount: issue.comments || 0, // ✅ Now a main field
		createdAt: new Date(issue.created_at), // ✅ Now a main field
		closedAt: issue.closed_at ? new Date(issue.closed_at) : null, // ✅ Now a main field
		attributes: {
			state: issue.state,
			state_reason: issue.state_reason,
			milestone: issue.milestone?.title,
			locked: issue.locked,
			reactions: issue.reactions,
		},
	};

	if (existingIssue) {
		// Update existing issue
		await prisma.issue.update({
			where: { id: existingIssue.id },
			data: issueData,
		});
	} else {
		// Create new issue
		await prisma.issue.create({
			data: {
				organizationId: repo.organizationId,
				repositoryId: repo.id,
				externalId: issueExternalId,
				sourceTool: "github",
				...issueData,
			},
		});
	}

	// Update contributor
	if (issue.user?.login) {
		await upsertContributor({
			organizationId: repo.organizationId,
			repositoryId: repo.id,
			externalId: issue.user.id?.toString() || issue.user.login,
			sourceTool: "github",
			login: issue.user.login,
			name: issue.user.name,
			avatarUrl: issue.user.avatar_url,
			contributions: 1,
			lastContributedAt: new Date(),
		});
	}
}

async function handleIssueCommentEvent(payload: any, repo: Repository) {
	const action = payload.action;
	const comment = payload.comment;
	const issue = payload.issue;

	console.log("Issue comment event:", action, issue.number);

	// Update contributor
	if (comment.user?.login) {
		await upsertContributor({
			organizationId: repo.organizationId,
			repositoryId: repo.id,
			externalId: comment.user.id?.toString() || comment.user.login,
			sourceTool: "github",
			login: comment.user.login,
			name: comment.user.name,
			avatarUrl: comment.user.avatar_url,
			contributions: 1,
			lastContributedAt: new Date(),
		});
	}
}

// ============================================================================
// DEPLOYMENT EVENTS
// ============================================================================

async function handleDeploymentEvent(payload: any, repo: Repository) {
	const deployment = payload.deployment;

	console.log("Deployment event:", deployment.id);

	// Create deployment event
	await prisma.deploymentEvent.create({
		data: {
			organizationId: repo.organizationId,
			externalId: deployment.id.toString(),
			sourceTool: "github",
			environment: deployment.environment,
			status: "pending",
			deployedAt: new Date(deployment.created_at),
			attributes: {
				deployment_id: deployment.id,
				ref: deployment.ref,
				sha: deployment.sha,
				creator: deployment.creator?.login,
				description: deployment.description,
				task: deployment.task,
				payload: deployment.payload,
				url: deployment.url,
			},
		},
	});
}

async function handleDeploymentStatusEvent(payload: any) {
	const deploymentStatus = payload.deployment_status;
	const deployment = payload.deployment;

	console.log("Deployment status:", deploymentStatus.state);

	// Update deployment event status
	const deploymentEvent = await prisma.deploymentEvent.findUnique({
		where: {
			externalId_sourceTool: {
				externalId: deployment.id.toString(),
				sourceTool: "github",
			},
		},
	});

	if (deploymentEvent) {
		await prisma.deploymentEvent.update({
			where: { id: deploymentEvent.id },
			data: {
				status: deploymentStatus.state,
				attributes: {
					...jsonToObject(deploymentEvent.attributes),
					deployment_status: deploymentStatus.state,
					deployment_description: deploymentStatus.description,
					deployment_url: deploymentStatus.target_url,
					updated_at: new Date().toISOString(),
				},
			},
		});
	}
}

// ============================================================================
// MEMBER/CONTRIBUTOR EVENTS
// ============================================================================

async function handleMemberEvent(payload: any, repo: Repository) {
	const action = payload.action;
	const member = payload.member;

	console.log("Member event:", action, member.login);

	if (action === "added") {
		await upsertContributor({
			organizationId: repo.organizationId,
			repositoryId: repo.id,
			externalId: member.id?.toString() || member.login,
			sourceTool: "github",
			login: member.login,
			name: member.name,
			avatarUrl: member.avatar_url,
			contributions: 0,
		});
	} else if (action === "removed") {
		const contributor = await prisma.contributor.findFirst({
			where: {
				repositoryId: repo.id,
				login: member.login,
				sourceTool: "github",
			},
		});

		if (contributor) {
			await prisma.contributor.delete({
				where: { id: contributor.id },
			});
		}
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface UpsertContributorParams {
	organizationId: string;
	repositoryId: string;
	externalId: string;
	sourceTool: string;
	login: string;
	name?: string;
	email?: string;
	avatarUrl?: string;
	contributions?: number;
	lastContributedAt?: Date;
}

async function upsertContributor(params: UpsertContributorParams) {
	const {
		organizationId,
		repositoryId,
		externalId,
		sourceTool,
		login,
		name,
		email,
		avatarUrl,
		contributions = 1,
		lastContributedAt,
	} = params;

	try {
		const contributor = await prisma.contributor.upsert({
			where: {
				externalId_sourceTool: {
					externalId,
					sourceTool,
				},
			},
			update: {
				login,
				name: name || undefined, // ✅ Now a main field
				email: email || undefined, // ✅ Now a main field
				avatarUrl: avatarUrl || undefined, // ✅ Now a main field
				contributions: {
					increment: contributions,
				},
				lastContributedAt: lastContributedAt || new Date(), // ✅ Now a main field
			},
			create: {
				externalId,
				sourceTool,
				login,
				name: name || undefined, // ✅ Now a main field
				email: email || undefined, // ✅ Now a main field
				avatarUrl: avatarUrl || undefined, // ✅ Now a main field
				contributions,
				lastContributedAt: lastContributedAt || new Date(), // ✅ Now a main field
				repositoryId,
				organizationId,
			},
		});

		return contributor;
	} catch (error) {
		console.error("Failed to upsert contributor:", error);
		throw new Error(
			"Failed to upsert contributor due to an internal error"
		);
	}
}

// Export handlers
export {
	handleRepositoryEvent,
	handleCreateEvent,
	handleDeleteEvent,
	handlePushEvent,
	handlePullRequestEvent,
	handlePullRequestReviewEvent,
	handlePullRequestReviewCommentEvent,
	handleIssuesEvent,
	handleIssueCommentEvent,
	handleDeploymentEvent,
	handleDeploymentStatusEvent,
	handleMemberEvent,
};
