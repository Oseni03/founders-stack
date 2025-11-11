/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapIssueToTaskData } from "@/lib/connectors/jira";

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
 * Handle different Jira event types and update Task
 */
async function handleJiraEvent(
	payload: JiraWebhookPayload,
	organizationId: string,
	projectId: string
) {
	const { webhookEvent, issue: unmapped } = payload;
	const issue = mapIssueToTaskData(unmapped);

	switch (webhookEvent) {
		case "jira:issue_created":
			console.log("New Jira issue created:", issue.title);

			// Create new Task entry
			await prisma.task.create({
				data: {
					organizationId,
					externalId: issue.externalId,
					sourceTool: "jira",
					title: issue.title,
					description: issue.description,
					status: issue.status,
					assignee: issue.assignee,
					assigneeId: issue.assigneeId,
					priority: issue.priority,
					url: issue.url,
					dueDate: issue.dueDate,
					labels: issue.labels || [],
					createdAt: issue.createdAt,
					updatedAt: issue.updatedAt,
					attributes: issue.attributes,
					projectId,
					lastSyncedAt: new Date(),
				},
			});
			break;

		case "jira:issue_updated":
			console.log("Jira issue updated:", issue.title);

			// Get existing task to merge attributes
			const existingTask = await prisma.task.findFirst({
				where: {
					externalId: issue.externalId,
					sourceTool: "jira",
					organizationId,
				},
			});

			if (existingTask) {
				await prisma.task.update({
					where: { id: existingTask.id },
					data: issue,
				});
			}
			break;

		case "jira:issue_deleted":
			console.log("Jira issue deleted:", issue.title);

			// Delete Task entry
			await prisma.task.deleteMany({
				where: {
					externalId: issue.externalId,
					sourceTool: "jira",
					organizationId,
				},
			});
			break;

		case "comment_created":
			console.log("Comment created on issue:", issue.title);

			// Update comment count in attributes
			const taskForComment = await prisma.task.findFirst({
				where: {
					externalId: issue.externalId,
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
							commentCount: unmapped.fields.comment?.total || 0,
						},
						updatedAt: new Date(),
					},
				});
			}
			break;

		case "comment_deleted":
			console.log("Comment deleted on issue:", issue.title);

			// Update comment count in attributes
			const taskForDeletedComment = await prisma.task.findFirst({
				where: {
					externalId: issue.externalId,
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
							commentCount: unmapped.fields.comment?.total || 0,
						},
						updatedAt: new Date(),
					},
				});
			}
			break;

		case "comment_updated":
			console.log("Comment updated on issue:", issue.title);
			// No action needed
			break;

		case "worklog_updated":
			console.log("Worklog updated on issue:", issue.title);
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
	{ params }: { params: Promise<{ organizationId: string }> }
) {
	try {
		const { organizationId } = await params;
		// Optional: Get the webhook secret from environment variables
		const payload = await request.text();
		const data: JiraWebhookPayload = JSON.parse(payload);

		// Get signature headers
		// const hubSignature = request.headers.get("x-hub-signature");
		// const authHeader = request.headers.get("authorization");
		const webhookId = request.headers.get("x-atlassian-webhook-identifier");

		console.log(`📥 Jira webhook received: ${data.webhookEvent}`);

		const integration = await prisma.integration.findFirst({
			where: {
				organizationId,
				toolName: "jira",
				status: { in: ["CONNECTED", "SYNCING"] },
			},
		});

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
