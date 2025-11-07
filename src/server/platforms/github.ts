/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { GitHubConnector } from "@/lib/connectors/github";
import { prisma } from "@/lib/prisma";
import { getIntegration } from "../integrations";
import { Repository } from "@prisma/client";
import { CommitData } from "@/types/code";

export async function syncGitHub(
	organizationId: string,
	repos: Repository[] = []
) {
	// Fetch integration
	const integration = await getIntegration(organizationId, "github");
	if (!integration?.accessToken) {
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
			integration.accessToken!,
			repo.owner,
			repo.name
		);

		try {
			console.log(`🔄 Starting sync for repo: ${repo.name}`);

			// Fetch all paginated data in parallel
			const [
				commits,
				pullRequests,
				issues,
				branches,
				repoHealth,
				contributors,
			] = await Promise.all([
				fetchAllCommits(connector),
				connector.fetchAllPullRequests(),
				connector.fetchAllIssues(),
				connector.fetchAllBranches(),
				connector.computeRepositoryHealth(),
				connector.fetchAllContributors(),
			]);

			console.log(`📊 Fetched data for ${repo.name}:`, {
				commits: commits.length,
				pullRequests: pullRequests.length,
				issues: issues.length,
				branches: branches.length,
				contributors: contributors.length,
			});

			// Batch upsert using Prisma transaction
			await prisma.$transaction(async (tx) => {
				// Upsert commits in batches to avoid query size limits
				if (commits.length > 0) {
					await batchUpsert(tx.commit, commits, 500, (commit) => ({
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
					}));
				}

				// Upsert pullRequests in batches
				if (pullRequests.length > 0) {
					await batchUpsert(
						tx.pullRequest,
						pullRequests,
						500,
						(pr) => ({
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
						})
					);
				}

				// Upsert issues in batches
				if (issues.length > 0) {
					await batchUpsert(tx.issue, issues, 500, (issue) => ({
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
					}));
				}

				// Upsert branches in batches
				if (branches.length > 0) {
					await batchUpsert(tx.branch, branches, 500, (branch) => ({
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
					}));
				}

				// Upsert contributors in batches
				if (contributors.length > 0) {
					await batchUpsert(
						tx.contributor,
						contributors,
						500,
						(contributor) => ({
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
						})
					);
				}

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

	console.log(`✅ GitHub sync completed for project: ${organizationId}`);
}

// Helper function to fetch all commits with pagination
async function fetchAllCommits(
	connector: GitHubConnector
): Promise<CommitData[]> {
	const allCommits: CommitData[] = [];
	let page = 1;
	const perPage = 100;

	while (true) {
		try {
			const commits = await connector.fetchCommits();

			if (commits.length === 0) break;

			allCommits.push(...commits);

			// If we got fewer items than perPage, we've reached the end
			if (commits.length < perPage) break;

			page++;
		} catch (error) {
			console.error(`Error fetching commits page ${page}:`, error);
			break;
		}
	}

	return allCommits;
}

// Helper function to batch upsert records
async function batchUpsert<T, R>(
	model: any,
	data: T[],
	batchSize: number,
	mapper: (item: T) => R
): Promise<void> {
	for (let i = 0; i < data.length; i += batchSize) {
		const batch = data.slice(i, i + batchSize);
		await model.createMany({
			data: batch.map(mapper),
			skipDuplicates: true,
		});
	}
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
