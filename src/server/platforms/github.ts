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
				platform: "github",
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
						platform: "github",
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
							platform: "github",
							repositoryId: repo.id,
						})
					);
				}

				// Upsert issues in batches
				if (issues.length > 0) {
					await batchUpsert(tx.task, issues, 500, (issue) => ({
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
						platform: "github",
						repositoryId: repo.id,
					}));
				}

				// ✅ Upsert deployment events in batches
				if (deploymentEvents.length > 0) {
					// First, try to link deployment events to existing commits
					const deploymentsWithCommits = await Promise.all(
						deploymentEvents.map(async (deployment) => {
							// Try to find the commit for this deployment
							const commit = await tx.commit.findFirst({
								where: {
									externalId: deployment.commitHash,
									repositoryId: repo.id,
									// organizationId,
								},
								select: { id: true },
							});

							return {
								...deployment,
								commitId: commit?.id || null,
							};
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
				organizationId_platform: {
					organizationId,
					platform: "github",
				},
			},
		});

		if (!integration || integration.platform !== "github") {
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
					platform: "github",
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
								externalId_platform: {
									externalId: webhook.id.toString(),
									platform: "github",
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
									platform: "github",
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
				organizationId_platform: {
					organizationId,
					platform: "github",
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

		// Push events (commits)
		case "push":
			await handlePushEvent(payload, repository);
			break;

		// Pull request events
		case "pull_request":
			await handlePullRequestEvent(payload, repository);
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
					// isArchived: true,
					metadata: {
						...jsonToObject(repo.metadata),
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
					// isArchived: false,
					metadata: {
						...jsonToObject(repo.metadata),
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
					metadata: {
						...jsonToObject(repo.metadata),
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
					metadata: {
						...jsonToObject(repo.metadata),
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
					metadata: {
						...jsonToObject(repo.metadata),
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
	// 			platform: "github",
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

	// Create commits
	for (const commit of commits) {
		const existingCommit = await prisma.commit.findUnique({
			where: {
				repositoryId_externalId: {
					externalId: commit.id,
					repositoryId: repo.id,
				},
			},
		});

		if (!existingCommit) {
			await prisma.commit.create({
				data: {
					repositoryId: repo.id,
					externalId: commit.id,
					platform: "github",
					branch,
					authorName:
						commit.author?.name ||
						commit.author?.username ||
						"Unknown",
					authorEmail: commit.author?.email || "",
					authorId: commit.author?.username || null,
					message: commit.message,
					timestamp: new Date(commit.timestamp),
					additions: commit.added?.length || 0,
					deletions: commit.removed?.length || 0,
					filesChanged:
						(commit.added?.length || 0) +
						(commit.removed?.length || 0) +
						(commit.modified?.length || 0),
					url: commit.url,
					syncedAt: new Date(),
				},
			});
			logger.info(
				`[${new Date().toISOString()}] Created commit: ${commit.id} in ${repo.fullName}`
			);
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

	const getState = () => {
		if (pullRequest.merged) return "merged";
		if (pullRequest.draft) return "draft";
		return pullRequest.state; // "open" or "closed"
	};

	const getApprovalStatus = () => {
		if (pullRequest.draft) return "draft";
		if (pullRequest.merged) return "approved";
		if (pullRequest.requested_reviewers?.length > 0) {
			return "awaiting_review";
		}
		if (pullRequest.state === "open") return "in_review";
		return "pending";
	};

	const prExternalId = pullRequest.id.toString();
	const existingPR = await prisma.pullRequest.findUnique({
		where: {
			repositoryId_externalId: {
				externalId: prExternalId,
				repositoryId: repo.id,
			},
		},
	});

	const prData = {
		number: pullRequest.number,
		title: pullRequest.title,
		description: pullRequest.body || null,
		url: pullRequest.html_url,
		state: getState(),
		approvalStatus: getApprovalStatus(),
		sourceBranch: pullRequest.head?.ref || "",
		targetBranch: pullRequest.base?.ref || "",
		authorId: pullRequest.user?.id?.toString() || null,
		authorName: pullRequest.user?.login || "Unknown",
		authorAvatar: pullRequest.user?.avatar_url || null,
		reviewers:
			pullRequest.requested_reviewers?.map((r: any) => ({
				id: r.id,
				login: r.login,
				avatar_url: r.avatar_url,
			})) || [],
		labels: pullRequest.labels?.map((l: any) => l.name) || [],
		additions: pullRequest.additions || 0,
		deletions: pullRequest.deletions || 0,
		changedFiles: pullRequest.changed_files || 0,
		closedAt: pullRequest.closed_at
			? new Date(pullRequest.closed_at)
			: null,
		mergedAt: pullRequest.merged_at
			? new Date(pullRequest.merged_at)
			: null,
		createdAt: new Date(pullRequest.created_at),
		updatedAt: new Date(pullRequest.updated_at),
		syncedAt: new Date(),
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
				repositoryId: repo.id,
				externalId: prExternalId,
				...prData,
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Created pull request: #${pullRequest.number} in ${repo.fullName}`
		);
	}
}

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

	// Update the PR approval status based on review
	const existingPR = await prisma.pullRequest.findUnique({
		where: {
			repositoryId_externalId: {
				externalId: pullRequest.id.toString(),
				repositoryId: repo.id,
			},
		},
	});

	if (existingPR) {
		const newApprovalStatus =
			review.state === "approved"
				? "approved"
				: review.state === "changes_requested"
					? "changes_requested"
					: "in_review";

		await prisma.pullRequest.update({
			where: { id: existingPR.id },
			data: {
				approvalStatus: newApprovalStatus,
				syncedAt: new Date(),
			},
		});
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
}

// ============================================================================
// STATUS EVENTS (Now mapped to Build model)
// ============================================================================

async function handleStatusEvent(payload: any, repo: Repository) {
	const commitSha = payload.sha;
	const state = payload.state; // e.g., "pending", "success", "failure"
	const context = payload.context; // e.g., "Vercel", "CI"
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

	// Map GitHub status to build status
	const buildStatus =
		state === "success"
			? "success"
			: state === "failure"
				? "failed"
				: state === "error"
					? "error"
					: "pending";

	const externalId = `${commitSha}-${context}`;

	const existingBuild = await prisma.build.findUnique({
		where: {
			repositoryId_externalId: {
				externalId,
				repositoryId: repo.id,
			},
		},
	});

	const buildData = {
		status: buildStatus,
		commitSha,
		branch: payload.branches?.[0]?.name || null,
		triggeredBy: payload.sender?.login || null,
		url: targetUrl,
		startedAt: existingBuild?.startedAt || new Date(),
		completedAt:
			state === "success" || state === "failure" ? new Date() : null,
		duration:
			existingBuild?.startedAt &&
			(state === "success" || state === "failure")
				? Math.floor(
						(Date.now() - existingBuild.startedAt.getTime()) / 1000
					)
				: null,
		syncedAt: new Date(),
	};

	if (existingBuild) {
		await prisma.build.update({
			where: { id: existingBuild.id },
			data: buildData,
		});
		logger.info(
			`[${new Date().toISOString()}] Updated build for commit ${commitSha} in ${repo.fullName}`
		);
	} else {
		await prisma.build.create({
			data: {
				repositoryId: repo.id,
				externalId,
				...buildData,
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Created build for commit ${commitSha} in ${repo.fullName}`
		);
	}
}

// ============================================================================
// DEPLOYMENT EVENTS (Mapped to Build model)
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

	await prisma.build.create({
		data: {
			repositoryId: repo.id,
			externalId: deployment.id.toString(),
			status: "pending",
			commitSha: deployment.sha || null,
			branch: deployment.ref || null,
			triggeredBy: deployment.creator?.login || null,
			url: deployment.url || null,
			startedAt: new Date(deployment.created_at),
			syncedAt: new Date(),
		},
	});
	logger.info(
		`[${new Date().toISOString()}] Created deployment build: ${deployment.id} in ${repo.fullName}`
	);
}

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

	const buildStatus =
		deploymentStatus.state === "success"
			? "success"
			: deploymentStatus.state === "failure"
				? "failed"
				: deploymentStatus.state === "error"
					? "error"
					: "pending";

	const existingBuild = await prisma.build.findUnique({
		where: {
			repositoryId_externalId: {
				externalId: deployment.id.toString(),
				repositoryId: repo.id,
			},
		},
	});

	if (existingBuild) {
		const isCompleted =
			buildStatus === "success" ||
			buildStatus === "failed" ||
			buildStatus === "error";

		await prisma.build.update({
			where: { id: existingBuild.id },
			data: {
				status: buildStatus,
				completedAt: isCompleted ? new Date() : null,
				duration:
					isCompleted && existingBuild.startedAt
						? Math.floor(
								(Date.now() -
									existingBuild.startedAt.getTime()) /
									1000
							)
						: null,
				url: deploymentStatus.target_url || existingBuild.url,
				syncedAt: new Date(),
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Updated deployment build: ${deployment.id} in ${repo.fullName}`
		);
	} else {
		// Create a new build if not found (fallback)
		await prisma.build.create({
			data: {
				repositoryId: repo.id,
				externalId: deployment.id.toString(),
				status: buildStatus,
				commitSha: deployment.sha || null,
				branch: deployment.ref || null,
				triggeredBy: deployment.creator?.login || null,
				url: deploymentStatus.target_url || null,
				startedAt: new Date(),
				completedAt:
					buildStatus === "success" || buildStatus === "failed"
						? new Date()
						: null,
				syncedAt: new Date(),
			},
		});
		logger.info(
			`[${new Date().toISOString()}] Created deployment build: ${deployment.id} in ${repo.fullName}`
		);
	}
}

// Export handlers
export {
	handleRepositoryEvent,
	handleCreateEvent,
	handlePushEvent,
	handlePullRequestEvent,
	handlePullRequestReviewEvent,
	handlePullRequestReviewCommentEvent,
	handleDeploymentEvent,
	handleDeploymentStatusEvent,
};
