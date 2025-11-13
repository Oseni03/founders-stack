/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { GitHubConnector } from "@/lib/connectors/github";
import { prisma } from "@/lib/prisma";
import { getIntegration } from "../integrations";
import { Repository } from "@prisma/client";
import logger from "@/lib/logger";
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
				contributors,
				deploymentEvents, // ✅ Added deployment events
			] = await Promise.all([
				fetchAllCommits(connector),
				connector.fetchAllPullRequests(),
				connector.fetchAllIssues(),
				connector.fetchAllBranches(),
				connector.fetchAllContributors(),
				connector.fetchAllDeployments(), // ✅ Fetch deployment events
			]);

			console.log(`📊 Fetched data for ${repo.name}:`, {
				commits: commits.length,
				pullRequests: pullRequests.length,
				issues: issues.length,
				branches: branches.length,
				contributors: contributors.length,
				deploymentEvents: deploymentEvents.length, // ✅ Log deployment events count
			});

			// Batch upsert using Prisma transaction
			await prisma.$transaction(async (tx) => {
				// Upsert commits in batches
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

				// ✅ Upsert deployment events in batches
				if (deploymentEvents.length > 0) {
					// First, try to link deployment events to existing commits
					const deploymentsWithCommits = await Promise.all(
						deploymentEvents.map(async (deployment) => {
							// Try to find the commit for this deployment
							const commit = await tx.commit.findFirst({
								where: {
									sha: deployment.commitHash,
									repositoryId: repo.id,
									organizationId,
								},
								select: { id: true },
							});

							return {
								...deployment,
								commitId: commit?.id || null,
							};
						})
					);

					await batchUpsert(
						tx.deploymentEvent,
						deploymentsWithCommits,
						500,
						(deployment) => ({
							externalId: deployment.externalId,
							commitHash: deployment.commitHash,
							status: deployment.status,
							environment: deployment.environment,
							errorLogSummary: deployment.errorLogSummary,
							buildDuration: deployment.buildDuration,
							deployedAt: deployment.deployedAt,
							attributes: deployment.attributes,
							commitId: deployment.commitId,
							lastSyncedAt: new Date(),
							organizationId,
							sourceTool: "github",
						})
					);
				}
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

export async function disconnectGitHubIntegration(
	organizationId: string
): Promise<{ success: boolean; message: string }> {
	const startTime = Date.now();
	console.log(
		`[${new Date().toISOString()}] Starting GitHub disconnection for organization ${organizationId}`
	);

	try {
		console.log(
			`[${new Date().toISOString()}] Fetching GitHub integration`
		);
		const integration = await prisma.integration.findUnique({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "github",
				},
			},
		});

		if (!integration || integration.toolName !== "github") {
			const errorMsg = "GitHub integration not found";
			console.error(
				`[${new Date().toISOString()}] ${errorMsg} for organization ${organizationId}`
			);
			throw new Error(errorMsg);
		}
		console.log(
			`[${new Date().toISOString()}] Found integration: IntegrationID=${integration.id}`
		);

		const accessToken = integration.accessToken!;
		const attributes = integration.attributes as Record<string, any> | null;
		const owner = attributes?.owner || null;

		// Delete webhooks if they exist
		if (owner) {
			console.log(
				`[${new Date().toISOString()}] Fetching repositories for owner ${owner}`
			);
			const connector = new GitHubConnector(accessToken, owner);

			// Fetch all repositories to check for webhooks
			const repos = await prisma.repository.findMany({
				where: {
					organizationId,
					sourceTool: "github",
					owner,
				},
			});

			for (const repo of repos) {
				try {
					console.log(
						`[${new Date().toISOString()}] Checking webhooks for repository ${repo.fullName}`
					);
					connector.setRepository(repo.owner, repo.name);

					// Fetch existing webhooks
					const webhookFetchStart = Date.now();
					const webhooks = await connector.listWebhooks();
					const webhookFetchDuration = Date.now() - webhookFetchStart;
					console.log(
						`[${new Date().toISOString()}] Fetched ${webhooks.resources.length} webhooks for ${repo.fullName} in ${webhookFetchDuration}ms`
					);

					// Delete webhooks that match our webhook URL
					for (const webhook of webhooks.resources) {
						const repoWebhook = await prisma.webhook.findUnique({
							where: {
								externalId_sourceTool: {
									externalId: webhook.id.toString(),
									sourceTool: "github",
								},
							},
						});
						if (repoWebhook) {
							console.log(
								`[${new Date().toISOString()}] Deleting webhook ${webhook.id} for ${repo.fullName}`
							);
							const webhookDeleteStart = Date.now();
							await connector.deleteWebhook(webhook.id);
							const webhookDeleteDuration =
								Date.now() - webhookDeleteStart;
							console.log(
								`[${new Date().toISOString()}] Webhook ${webhook.id} deleted successfully for ${repo.fullName} in ${webhookDeleteDuration}ms`
							);

							// Delete webhook from database
							const dbWebhookDeleteStart = Date.now();
							await prisma.webhook.deleteMany({
								where: {
									repositoryId: repo.id,
									externalId: webhook.id.toString(),
									sourceTool: "github",
								},
							});
							const dbWebhookDeleteDuration =
								Date.now() - dbWebhookDeleteStart;
							console.log(
								`[${new Date().toISOString()}] Webhook ${webhook.id} removed from database for ${repo.fullName} in ${dbWebhookDeleteDuration}ms`
							);
						}
					}
				} catch (error) {
					const errorMsg =
						error instanceof Error
							? error.message
							: "Unknown error";
					console.warn(
						`[${new Date().toISOString()}] Failed to process webhooks for ${repo.fullName}: ${errorMsg}`
					);
					// Continue with other repositories
				}
			}
		} else {
			console.log(
				`[${new Date().toISOString()}] No owner found in integration attributes, skipping webhook deletion`
			);
		}

		// Update integration status
		console.log(
			`[${new Date().toISOString()}] Updating integration status to DISCONNECTED`
		);
		const dbStart = Date.now();
		await prisma.integration.update({
			where: {
				organizationId_toolName: {
					organizationId,
					toolName: "github",
				},
			},
			data: {
				status: "DISCONNECTED",
				webhookId: null,
				webhookUrl: null,
				accessToken: null,
			},
		});
		const dbDuration = Date.now() - dbStart;
		console.log(
			`[${new Date().toISOString()}] Integration status updated to DISCONNECTED in ${dbDuration}ms`
		);

		const totalDuration = Date.now() - startTime;
		console.log(
			`[${new Date().toISOString()}] GitHub integration disconnected successfully in ${totalDuration}ms`
		);

		return {
			success: true,
			message: "GitHub integration disconnected successfully",
		};
	} catch (error) {
		const errorMsg =
			error instanceof Error
				? error.message
				: "Failed to disconnect GitHub integration";
		console.error(
			`[${new Date().toISOString()}] Failed to disconnect GitHub integration for organization ${organizationId}: ${errorMsg}`
		);
		throw new Error(errorMsg);
	}
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
export async function processGitHubEvent(
	event: string,
	payload: any,
	repository: Repository
) {
	const startTime = Date.now();
	logger.info(
		`[${new Date().toISOString()}] Processing GitHub event: ${event}`,
		{
			repositoryId: repository.id,
			repository: repository.fullName,
		}
	);

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

		// Status events (for CI/CD status updates)
		case "status":
			await handleStatusEvent(payload, repository);
			break;

		// Deployment events
		case "deployment":
			await handleDeploymentEvent(payload, repository);
			break;

		// Deployment status events
		case "deployment_status":
			await handleDeploymentStatusEvent(payload, repository);
			break;

		// Member/Contributor events
		case "member":
			await handleMemberEvent(payload, repository);
			break;

		default:
			logger.info(
				`[${new Date().toISOString()}] Ignoring unhandled GitHub event: ${event}`,
				{
					repositoryId: repository.id,
					repository: repository.fullName,
					supportedEvents: [
						"repository",
						"create",
						"delete",
						"push",
						"pull_request",
						"issues",
						"status",
						"deployment",
						"deployment_status",
						"member",
					],
				}
			);
	}

	const duration = Date.now() - startTime;
	logger.info(
		`[${new Date().toISOString()}] Finished processing GitHub event: ${event} in ${duration}ms`,
		{
			repositoryId: repository.id,
			repository: repository.fullName,
		}
	);
}

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

	logger.info(
		`[${new Date().toISOString()}] Handling repository event: ${action}`,
		{
			repositoryId: repo.id,
			repository: repository.full_name,
		}
	);

	switch (action) {
		case "deleted":
			await prisma.repository.delete({
				where: { id: repo.id },
			});
			logger.info(
				`[${new Date().toISOString()}] Repository deleted: ${repo.fullName}`
			);
			break;

		case "archived":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					isArchived: true,
					attributes: {
						...jsonToObject(repo.attributes),
						archived_at: new Date().toISOString(),
					},
				},
			});
			logger.info(
				`[${new Date().toISOString()}] Repository archived: ${repo.fullName}`
			);
			break;

		case "unarchived":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					isArchived: false,
					attributes: {
						...jsonToObject(repo.attributes),
						unarchived_at: new Date().toISOString(),
					},
				},
			});
			logger.info(
				`[${new Date().toISOString()}] Repository unarchived: ${repo.fullName}`
			);
			break;

		case "edited":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					name: repository.name,
					fullName: repository.full_name,
					description: repository.description,
					isPrivate: repository.private,
					language: repository.language || null,
					defaultBranch: repository.default_branch || null,
					attributes: {
						...jsonToObject(repo.attributes),
						edited_at: new Date().toISOString(),
					},
				},
			});
			logger.info(
				`[${new Date().toISOString()}] Repository edited: ${repo.fullName}`
			);
			break;

		case "transferred":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					owner: repository.owner.login,
					attributes: {
						...jsonToObject(repo.attributes),
						transferred: true,
						transferred_at: new Date().toISOString(),
						previous_owner: payload.changes?.owner?.from?.login,
					},
				},
			});
			logger.info(
				`[${new Date().toISOString()}] Repository transferred: ${repo.fullName}`
			);
			break;

		case "renamed":
			await prisma.repository.update({
				where: { id: repo.id },
				data: {
					name: repository.name,
					fullName: repository.full_name,
					attributes: {
						...jsonToObject(repo.attributes),
						renamed_at: new Date().toISOString(),
						previous_name: payload.changes?.repository?.name?.from,
					},
				},
			});
			logger.info(
				`[${new Date().toISOString()}] Repository renamed: ${repo.fullName}`
			);
			break;
	}
}

// ============================================================================
// BRANCH EVENTS
// ============================================================================

async function handleCreateEvent(payload: any, repo: Repository) {
	const refType = payload.ref_type;
	const ref = payload.ref;

	logger.info(
		`[${new Date().toISOString()}] Handling create event: ${refType} ${ref}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

	// if (refType === "branch") {
	// 	await prisma.branch.create({
	// 		data: {
	// 			organizationId: repo.organizationId,
	// 			repositoryId: repo.id,
	// 			externalId: ref,
	// 			sourceTool: "github",
	// 			name: ref,
	// 			status: "active",
	// 			lastCommitAt: new Date(),
	// 			createdBy: payload.sender?.login,
	// 			isProtected: false,
	// 			sha: payload.master_branch || null,
	// 			commitsAhead: 0,
	// 			commitsBehind: 0,
	// 			attributes: {
	// 				pusher_type: payload.pusher_type,
	// 				created_at: new Date().toISOString(),
	// 			},
	// 		},
	// 	});
	// 	logger.info(
	// 		`[${new Date().toISOString()}] Branch created: ${ref} in ${repo.fullName}`
	// 	);
	// }
}

async function handleDeleteEvent(payload: any, repo: Repository) {
	const refType = payload.ref_type;
	const ref = payload.ref;

	logger.info(
		`[${new Date().toISOString()}] Handling delete event: ${refType} ${ref}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

	if (refType === "branch") {
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
			logger.info(
				`[${new Date().toISOString()}] Branch deleted: ${ref} in ${repo.fullName}`
			);
		} else {
			logger.warn(
				`[${new Date().toISOString()}] Branch not found: ${ref} in ${repo.fullName}`
			);
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

	logger.info(
		`[${new Date().toISOString()}] Handling push event: ${branch} with ${commits.length} commits`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
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
				sha: payload.head_commit?.id,
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Updated branch: ${branch} in ${repo.fullName}`
		);
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
				sha: payload.head_commit?.id,
				isProtected: false,
				commitsAhead: 0,
				commitsBehind: 0,
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Created branch: ${branch} in ${repo.fullName}`
		);
	}

	// Create commits
	for (const commit of commits) {
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
					sha: commit.id,
					branch,
					authorName: commit.author?.name || commit.author?.username,
					authorEmail: commit.author?.email,
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
					avatarUrl: payload.sender?.avatar_url || null,
					attributes: {
						added_files: commit.added,
						removed_files: commit.removed,
						modified_files: commit.modified,
						distinct: commit.distinct,
					},
				},
			});
			logger.info(
				`[${new Date().toISOString()}] Created commit: ${commit.id} in ${repo.fullName}`
			);

			if (commit.author?.username) {
				await upsertContributor({
					organizationId: repo.organizationId,
					repositoryId: repo.id,
					externalId: commit.author.username,
					sourceTool: "github",
					login: commit.author.username,
					name: commit.author.name,
					email: commit.author.email,
					avatarUrl: payload.sender?.avatar_url,
					contributions: 1,
					lastContributedAt: new Date(commit.timestamp),
				});
				logger.info(
					`[${new Date().toISOString()}] Updated contributor: ${commit.author.username} for ${repo.fullName}`
				);
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

	logger.info(
		`[${new Date().toISOString()}] Handling pull request event: ${action} PR #${pullRequest.number}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

	const getStatus = () => {
		if (pullRequest.merged) return "merged";
		if (pullRequest.draft) return "draft";
		return pullRequest.state;
	};

	const getReviewStatus = () => {
		if (pullRequest.draft) return "draft";
		if (pullRequest.requested_reviewers?.length > 0) {
			return "awaiting_review";
		}
		if (pullRequest.state === "open") return "in_review";
		return null;
	};

	const prExternalId = pullRequest.id.toString();
	const existingPR = await prisma.pullRequest.findUnique({
		where: {
			externalId_sourceTool: {
				externalId: prExternalId,
				sourceTool: "github",
			},
		},
	});

	let avgReviewTime = null;
	if (pullRequest.merged_at && pullRequest.created_at) {
		const created = new Date(pullRequest.created_at).getTime();
		const merged = new Date(pullRequest.merged_at).getTime();
		avgReviewTime = (merged - created) / (1000 * 60 * 60); // Convert to hours
	}

	const prData = {
		title: pullRequest.title,
		number: pullRequest.number,
		body: pullRequest.body || null,
		url: pullRequest.html_url,
		status: getStatus(),
		reviewStatus: getReviewStatus(),
		isDraft: pullRequest.draft || false,
		baseBranch: pullRequest.base?.ref || null,
		headBranch: pullRequest.head?.ref || null,
		authorId: pullRequest.user?.id || null,
		authorLogin: pullRequest.user?.login || null,
		reviewerIds:
			pullRequest.requested_reviewers?.map((r: any) => r.login) || [],
		avgReviewTime,
		closedAt: pullRequest.closed_at
			? new Date(pullRequest.closed_at)
			: null,
		mergedAt: pullRequest.merged_at
			? new Date(pullRequest.merged_at)
			: null,
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
		await prisma.pullRequest.update({
			where: { id: existingPR.id },
			data: prData,
		});
		logger.info(
			`[${new Date().toISOString()}] Updated pull request: #${pullRequest.number} in ${repo.fullName}`
		);
	} else {
		await prisma.pullRequest.create({
			data: {
				organizationId: repo.organizationId,
				repositoryId: repo.id,
				externalId: prExternalId,
				sourceTool: "github",
				...prData,
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Created pull request: #${pullRequest.number} in ${repo.fullName}`
		);
	}

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
		logger.info(
			`[${new Date().toISOString()}] Updated contributor: ${pullRequest.user.login} for ${repo.fullName}`
		);
	}
}

// Note: Not called in processGitHubEvent, included for completeness
async function handlePullRequestReviewEvent(payload: any, repo: Repository) {
	const review = payload.review;
	const pullRequest = payload.pull_request;

	logger.info(
		`[${new Date().toISOString()}] Handling PR review event: ${review.state} for PR #${pullRequest.number}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

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
		logger.info(
			`[${new Date().toISOString()}] Updated contributor: ${review.user.login} for ${repo.fullName}`
		);
	}
}

async function handlePullRequestReviewCommentEvent(
	payload: any,
	repo: Repository
) {
	const comment = payload.comment;
	const pullRequest = payload.pull_request;

	logger.info(
		`[${new Date().toISOString()}] Handling PR review comment event for PR #${pullRequest.number}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

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
		logger.info(
			`[${new Date().toISOString()}] Updated contributor: ${comment.user.login} for ${repo.fullName}`
		);
	}
}

// ============================================================================
// ISSUE EVENTS
// ============================================================================

async function handleIssuesEvent(payload: any, repo: Repository) {
	const action = payload.action;
	const issue = payload.issue;

	logger.info(
		`[${new Date().toISOString()}] Handling issue event: ${action} issue #${issue.number}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

	const getStatus = () => {
		if (issue.state === "closed") {
			return issue.state_reason === "completed" ? "closed" : "cancelled";
		}
		return "open";
	};

	const issueExternalId = issue.id.toString();
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
		number: issue.number,
		body: issue.body || null,
		url: issue.html_url,
		status: getStatus(),
		authorId: issue.user?.login || null,
		authorLogin: issue.user?.login || null,
		assigneeIds: issue.assignees?.map((a: any) => a.login) || [],
		labels:
			issue.labels?.map((l: any) =>
				typeof l === "string" ? l : l.name
			) || [],
		commentsCount: issue.comments || 0,
		closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
		attributes: {
			state: issue.state,
			state_reason: issue.state_reason,
			milestone: issue.milestone?.title,
			locked: issue.locked,
			reactions: issue.reactions,
		},
	};

	if (existingIssue) {
		await prisma.issue.update({
			where: { id: existingIssue.id },
			data: issueData,
		});
		logger.info(
			`[${new Date().toISOString()}] Updated issue: #${issue.number} in ${repo.fullName}`
		);
	} else {
		await prisma.issue.create({
			data: {
				organizationId: repo.organizationId,
				repositoryId: repo.id,
				externalId: issueExternalId,
				sourceTool: "github",
				...issueData,
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Created issue: #${issue.number} in ${repo.fullName}`
		);
	}

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
		logger.info(
			`[${new Date().toISOString()}] Updated contributor: ${issue.user.login} for ${repo.fullName}`
		);
	}
}

async function handleIssueCommentEvent(payload: any, repo: Repository) {
	const action = payload.action;
	const comment = payload.comment;
	const issue = payload.issue;

	logger.info(
		`[${new Date().toISOString()}] Handling issue comment event: ${action} for issue #${issue.number}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

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
		logger.info(
			`[${new Date().toISOString()}] Updated contributor: ${comment.user.login} for ${repo.fullName}`
		);
	}
}

// ============================================================================
// STATUS EVENTS
// ============================================================================

async function handleStatusEvent(payload: any, repo: Repository) {
	const commitSha = payload.sha;
	const state = payload.state; // e.g., "pending", "success", "failure"
	const context = payload.context; // e.g., "Vercel"
	const description = payload.description;
	const targetUrl = payload.target_url;

	logger.info(
		`[${new Date().toISOString()}] Handling status event: ${state} for commit ${commitSha}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
			context,
		}
	);

	// Find the corresponding commit
	const commit = await prisma.commit.findFirst({
		where: {
			repositoryId: repo.id,
			sha: commitSha,
			sourceTool: "github",
		},
	});

	// Update or create a deployment event
	const existingEvent = await prisma.deploymentEvent.findFirst({
		where: {
			commitHash: commitSha,
			sourceTool: "github",
		},
	});

	const eventData = {
		organizationId: repo.organizationId,
		repositoryId: repo.id,
		externalId: `${commitSha}-${context}`, // Unique per commit and context
		sourceTool: "github",
		commitHash: commitSha,
		commitId: commit?.id || null,
		status: state,
		environment: context || null,
		errorLogSummary: state === "failure" ? description : null,
		buildDuration: null, // Not provided in status payload
		deployedAt: new Date(),
		lastSyncedAt: new Date(),
		attributes: {
			context,
			description,
			target_url: targetUrl,
			updated_at: new Date().toISOString(),
		},
	};

	if (existingEvent) {
		await prisma.deploymentEvent.update({
			where: { id: existingEvent.id },
			data: {
				status: state,
				errorLogSummary: state === "failure" ? description : null,
				lastSyncedAt: new Date(),
				attributes: {
					...jsonToObject(existingEvent.attributes),
					context,
					description,
					target_url: targetUrl,
					updated_at: new Date().toISOString(),
				},
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Updated deployment event for commit ${commitSha} in ${repo.fullName}`
		);
	} else {
		await prisma.deploymentEvent.create({
			data: {
				...eventData,
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Created deployment event for commit ${commitSha} in ${repo.fullName}`
		);
	}
}

// ============================================================================
// DEPLOYMENT EVENTS
// ============================================================================

async function handleDeploymentEvent(payload: any, repo: Repository) {
	const deployment = payload.deployment;

	logger.info(
		`[${new Date().toISOString()}] Handling deployment event: ${deployment.id}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

	// Find the corresponding commit
	const commit = await prisma.commit.findFirst({
		where: {
			repositoryId: repo.id,
			sha: deployment.sha,
			sourceTool: "github",
		},
	});

	await prisma.deploymentEvent.create({
		data: {
			organizationId: repo.organizationId,
			externalId: deployment.id.toString(),
			sourceTool: "github",
			commitHash: deployment.sha || null,
			commitId: commit?.id || null,
			environment: deployment.environment || null,
			status: "pending",
			deployedAt: new Date(deployment.created_at),
			lastSyncedAt: new Date(),
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
	logger.info(
		`[${new Date().toISOString()}] Created deployment event: ${deployment.id} in ${repo.fullName}`
	);
}

// ============================================================================
// DEPLOYMENT STATUS EVENTS
// ============================================================================

async function handleDeploymentStatusEvent(payload: any, repo: Repository) {
	const deploymentStatus = payload.deployment_status;
	const deployment = payload.deployment;

	logger.info(
		`[${new Date().toISOString()}] Handling deployment status event: ${deploymentStatus.state}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

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
				errorLogSummary:
					deploymentStatus.state === "failure"
						? deploymentStatus.description
						: null,
				lastSyncedAt: new Date(),
				attributes: {
					...jsonToObject(deploymentEvent.attributes),
					deployment_status: deploymentStatus.state,
					deployment_description: deploymentStatus.description,
					deployment_url: deploymentStatus.target_url,
					updated_at: new Date().toISOString(),
				},
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Updated deployment event: ${deployment.id} in ${repo.fullName}`
		);
	} else {
		// Create a new event if not found (fallback)
		const commit = await prisma.commit.findFirst({
			where: {
				repositoryId: repo.id,
				sha: deployment.sha,
				sourceTool: "github",
			},
		});

		await prisma.deploymentEvent.create({
			data: {
				organizationId: repo.organizationId,
				externalId: deployment.id.toString(),
				sourceTool: "github",
				commitHash: deployment.sha || null,
				commitId: commit?.id || null,
				environment: deployment.environment || null,
				status: deploymentStatus.state,
				errorLogSummary:
					deploymentStatus.state === "failure"
						? deploymentStatus.description
						: null,
				deployedAt: new Date(),
				lastSyncedAt: new Date(),
				attributes: {
					deployment_id: deployment.id,
					deployment_status: deploymentStatus.state,
					deployment_description: deploymentStatus.description,
					deployment_url: deploymentStatus.target_url,
					ref: deployment.ref,
					sha: deployment.sha,
					creator: deployment.creator?.login,
					updated_at: new Date().toISOString(),
				},
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Created deployment event: ${deployment.id} in ${repo.fullName}`
		);
	}
}

// ============================================================================
// MEMBER/CONTRIBUTOR EVENTS
// ============================================================================

async function handleMemberEvent(payload: any, repo: Repository) {
	const action = payload.action;
	const member = payload.member;

	logger.info(
		`[${new Date().toISOString()}] Handling member event: ${action} for ${member.login}`,
		{
			repositoryId: repo.id,
			repository: repo.fullName,
		}
	);

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
		logger.info(
			`[${new Date().toISOString()}] Added contributor: ${member.login} in ${repo.fullName}`
		);
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
			logger.info(
				`[${new Date().toISOString()}] Removed contributor: ${member.login} from ${repo.fullName}`
			);
		} else {
			logger.warn(
				`[${new Date().toISOString()}] Contributor not found: ${member.login} in ${repo.fullName}`
			);
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
				name: name || undefined,
				email: email || undefined,
				avatarUrl: avatarUrl || undefined,
				contributions: {
					increment: contributions,
				},
				lastContributedAt: lastContributedAt || new Date(),
			},
			create: {
				externalId,
				sourceTool,
				login,
				name: name || undefined,
				email: email || undefined,
				avatarUrl: avatarUrl || undefined,
				contributions,
				lastContributedAt: lastContributedAt || new Date(),
				repositoryId,
				organizationId,
			},
		});

		logger.info(
			`[${new Date().toISOString()}] Upserted contributor: ${login}`,
			{
				repositoryId,
				contributions: contributor.contributions,
			}
		);

		return contributor;
	} catch (error) {
		const errorMsg =
			error instanceof Error ? error.message : "Internal server error";
		logger.error(
			`[${new Date().toISOString()}] Failed to upsert contributor: ${login}`,
			{
				repositoryId,
				error: errorMsg,
			}
		);
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
