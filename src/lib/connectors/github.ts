/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import { throttling } from "@octokit/plugin-throttling";
import { PaginatedResponse, PaginationOptions } from "@/types/connector";
import {
	BranchData,
	CommitData,
	ContributorData,
	IssueData,
	PullRequestData,
	RepoData,
	RepositoryHealthData,
} from "@/types/code";

// Extend Octokit with plugins for resilience against rate limits and transient errors
const OctokitWithPlugins = Octokit.plugin(retry, throttling);

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
