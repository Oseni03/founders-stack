/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { getIntegration } from "@/server/integrations";

// Jira webhook event types
type JiraEventType =
	| "jira:issue_created"
	| "jira:issue_updated"
	| "jira:issue_deleted"
	| "comment_created"
	| "comment_updated"
	| "comment_deleted"
	| "worklog_updated";

interface JiraWebhookPayload {
	timestamp: number;
	webhookEvent: JiraEventType;
	issue_event_type_name?: string;
	user: {
		self: string;
		accountId: string;
		displayName: string;
		emailAddress?: string;
	};
	issue: {
		id: string;
		key: string;
		self: string;
		fields: {
			summary: string;
			description?: any;
			status: {
				name: string;
				id: string;
			};
			priority?: {
				name: string;
				id: string;
			};
			assignee?: {
				accountId: string;
				displayName: string;
				emailAddress?: string;
			};
			reporter?: {
				accountId: string;
				displayName: string;
			};
			project: {
				id: string;
				key: string;
				name: string;
			};
			issuetype: {
				name: string;
				id: string;
			};
			labels?: string[];
			created: string;
			updated: string;
			comment?: {
				comments: any[];
				total: number;
			};
		};
	};
	changelog?: {
		items: Array<{
			field: string;
			fieldtype: string;
			from: string;
			fromString: string;
			to: string;
			toString: string;
		}>;
	};
	comment?: {
		id: string;
		body: string;
		author: {
			accountId: string;
			displayName: string;
		};
		created: string;
		updated: string;
	};
}

/**
 * Extract plain text from Jira ADF (Atlassian Document Format)
 */
function extractTextFromADF(description: any): string | null {
	if (!description) return null;

	// If it's already a string, return it
	if (typeof description === "string") return description;

	// Handle ADF format
	if (description.type === "doc" && description.content) {
		const textParts: string[] = [];

		const extractText = (node: any) => {
			if (node.type === "text") {
				textParts.push(node.text);
			}
			if (node.content) {
				node.content.forEach(extractText);
			}
		};

		description.content.forEach(extractText);
		return textParts.join(" ").trim() || null;
	}

	return null;
}

/**
 * Normalize Jira status to TaskStatus enum
 */
function normalizeJiraStatus(jiraStatus: string): TaskStatus {
	const statusLower = jiraStatus.toLowerCase();

	// Map common Jira statuses to TaskStatus
	if (
		statusLower.includes("done") ||
		statusLower.includes("closed") ||
		statusLower.includes("resolved")
	) {
		return "done";
	}
	if (
		statusLower.includes("progress") ||
		statusLower.includes("review") ||
		statusLower.includes("testing")
	) {
		return "in_progress";
	}
	// Default to open for: To Do, Open, Backlog, etc.
	return "open";
}

/**
 * Normalize Jira priority to TaskPriority enum
 */
function normalizeJiraPriority(jiraPriority?: string): TaskPriority {
	if (!jiraPriority) return "low";

	const priorityLower = jiraPriority.toLowerCase();

	if (
		priorityLower.includes("highest") ||
		priorityLower.includes("critical")
	) {
		return "urgent";
	}
	if (priorityLower.includes("high")) {
		return "high";
	}
	if (priorityLower.includes("medium")) {
		return "medium";
	}
	if (priorityLower.includes("low") || priorityLower.includes("lowest")) {
		return "low";
	}

	return "medium"; // Default
}

/**
 * Handle different Jira event types and update Task
 */
async function handleJiraEvent(
	payload: JiraWebhookPayload,
	organizationId: string,
	projectId: string
) {
	const { webhookEvent, issue, changelog } = payload;

	switch (webhookEvent) {
		case "jira:issue_created":
			console.log("New Jira issue created:", issue.key);

			// Create new Task entry
			await prisma.task.create({
				data: {
					organizationId,
					externalId: issue.id,
					sourceTool: "jira",
					title: issue.fields.summary,
					description: extractTextFromADF(issue.fields.description),
					status: normalizeJiraStatus(issue.fields.status?.name),
					assignee: issue.fields.assignee?.displayName || null,
					assigneeId: issue.fields.assignee?.accountId || null,
					priority: normalizeJiraPriority(
						issue.fields.priority?.name
					),
					url: `${issue.self.split("/rest/api")[0]}/browse/${issue.key}`,
					dueDate: null, // Jira doesn't always have due dates
					labels: issue.fields.labels || [],
					attributes: {
						issueKey: issue.key,
						issueType: issue.fields.issuetype?.name,
						issueTypeId: issue.fields.issuetype?.id,
						jiraPriority: issue.fields.priority?.name,
						jiraPriorityId: issue.fields.priority?.id,
						jiraStatus: issue.fields.status?.name,
						jiraStatusId: issue.fields.status?.id,
						projectKey: issue.fields.project?.key,
						projectName: issue.fields.project?.name,
						assignee: issue.fields.assignee
							? {
									accountId: issue.fields.assignee.accountId,
									displayName:
										issue.fields.assignee.displayName,
									email: issue.fields.assignee.emailAddress,
								}
							: null,
						created: issue.fields.created,
						commentCount: issue.fields.comment?.total || 0,
					},
					projectId,
					lastSyncedAt: new Date(),
				},
			});
			break;

		case "jira:issue_updated":
			console.log("Jira issue updated:", issue.key);

			// Prepare update data
			const updateData: any = {
				title: issue.fields.summary,
				description: extractTextFromADF(issue.fields.description),
				status: normalizeJiraStatus(issue.fields.status?.name),
				assignee: issue.fields.assignee?.displayName || null,
				assigneeId: issue.fields.assignee?.accountId || null,
				priority: normalizeJiraPriority(issue.fields.priority?.name),
				labels: issue.fields.labels || [],
				lastSyncedAt: new Date(),
				updatedAt: new Date(),
			};

			// Get existing task to merge attributes
			const existingTask = await prisma.task.findFirst({
				where: {
					externalId: issue.id,
					sourceTool: "jira",
					organizationId,
				},
			});

			if (existingTask) {
				updateData.attributes = {
					...((existingTask.attributes as Record<string, any>) || {}),
					issueKey: issue.key,
					issueType: issue.fields.issuetype?.name,
					issueTypeId: issue.fields.issuetype?.id,
					jiraPriority: issue.fields.priority?.name,
					jiraPriorityId: issue.fields.priority?.id,
					jiraStatus: issue.fields.status?.name,
					jiraStatusId: issue.fields.status?.id,
					assignee: issue.fields.assignee
						? {
								accountId: issue.fields.assignee.accountId,
								displayName: issue.fields.assignee.displayName,
								email: issue.fields.assignee.emailAddress,
							}
						: null,
					commentCount: issue.fields.comment?.total || 0,
					lastUpdated: new Date().toISOString(),
				};

				// Log status changes from changelog
				if (changelog?.items) {
					const statusChange = changelog.items.find(
						(item) => item.field === "status"
					);
					if (statusChange) {
						console.log(
							`Status changed from ${statusChange.fromString} to ${statusChange.toString}`
						);
						updateData.attributes.lastStatusChange = {
							from: statusChange.fromString,
							to: statusChange.toString,
							timestamp: new Date().toISOString(),
						};
					}

					const assigneeChange = changelog.items.find(
						(item) => item.field === "assignee"
					);
					if (assigneeChange) {
						console.log(
							`Assignee changed from ${assigneeChange.fromString} to ${assigneeChange.toString}`
						);
					}
				}

				await prisma.task.update({
					where: { id: existingTask.id },
					data: updateData,
				});
			}
			break;

		case "jira:issue_deleted":
			console.log("Jira issue deleted:", issue.key);

			// Delete Task entry
			await prisma.task.deleteMany({
				where: {
					externalId: issue.id,
					sourceTool: "jira",
					organizationId,
				},
			});
			break;

		case "comment_created":
			console.log("Comment created on issue:", issue.key);

			// Update comment count in attributes
			const taskForComment = await prisma.task.findFirst({
				where: {
					externalId: issue.id,
					sourceTool: "jira",
					organizationId,
				},
			});

			if (taskForComment) {
				const currentAttributes = taskForComment.attributes as Record<
					string,
					any
				>;
				await prisma.task.update({
					where: { id: taskForComment.id },
					data: {
						attributes: {
							...currentAttributes,
							commentCount: issue.fields.comment?.total || 0,
						},
						updatedAt: new Date(),
					},
				});
			}
			break;

		case "comment_deleted":
			console.log("Comment deleted on issue:", issue.key);

			// Update comment count in attributes
			const taskForDeletedComment = await prisma.task.findFirst({
				where: {
					externalId: issue.id,
					sourceTool: "jira",
					organizationId,
				},
			});

			if (taskForDeletedComment) {
				const currentAttributes =
					taskForDeletedComment.attributes as Record<string, any>;
				await prisma.task.update({
					where: { id: taskForDeletedComment.id },
					data: {
						attributes: {
							...currentAttributes,
							commentCount: issue.fields.comment?.total || 0,
						},
						updatedAt: new Date(),
					},
				});
			}
			break;

		case "comment_updated":
			console.log("Comment updated on issue:", issue.key);
			// No action needed
			break;

		case "worklog_updated":
			console.log("Worklog updated on issue:", issue.key);
			// No action needed
			break;

		default:
			console.log("Unknown Jira event type:", webhookEvent);
	}
}

/**
 * POST /api/webhooks/jira
 * Handles incoming webhooks from Jira
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string; organizationId: string }> }
) {
	try {
		const { userId, organizationId } = await params;
		// Optional: Get the webhook secret from environment variables
		const payload = await request.text();
		const data: JiraWebhookPayload = JSON.parse(payload);

		// Get signature headers
		// const hubSignature = request.headers.get("x-hub-signature");
		// const authHeader = request.headers.get("authorization");
		const webhookId = request.headers.get("x-atlassian-webhook-identifier");

		console.log(`📥 Jira webhook received: ${data.webhookEvent}`);

		const integration = await getIntegration(organizationId, "jira");

		if (!integration) {
			console.warn("⚠️  No integration found for webhook");
			return NextResponse.json(
				{ error: "Integration not found" },
				{ status: 404 }
			);
		}

		const attributes = integration.attributes as Record<string, any>;

		// Verify webhook signature if secret exists
		if (webhookId !== attributes.webhookId) {
			console.error("❌ Invalid webhook ID");
			return NextResponse.json(
				{ error: "Invalid webhook" },
				{ status: 401 }
			);
		}

		// Extract Jira project ID from the webhook payload
		const jiraProjectId = data.issue?.fields?.project?.id;

		if (!jiraProjectId) {
			console.error("No project ID found in webhook payload");
			return NextResponse.json(
				{ error: "Missing project ID in payload" },
				{ status: 400 }
			);
		}

		// Look up the project by Jira project ID
		const project = await prisma.project.findUnique({
			where: {
				externalId_sourceTool: {
					externalId: jiraProjectId,
					sourceTool: "jira",
				},
			},
			select: {
				id: true,
				organizationId: true,
			},
		});

		if (!project) {
			console.error(
				`No project found for Jira project ID: ${jiraProjectId}`
			);
			return NextResponse.json(
				{ error: "Project not found for this Jira project" },
				{ status: 404 }
			);
		}

		// Handle the event
		await handleJiraEvent(data, organizationId, project.id);

		// Return success response
		return NextResponse.json(
			{ success: true, event: data.webhookEvent },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing Jira webhook:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}

// Optional: Handle GET requests for webhook verification/health check
export async function GET() {
	return NextResponse.json({
		status: "Jira webhook endpoint is active",
		timestamp: new Date().toISOString(),
	});
}
