/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { AsanaConnector } from "@/lib/connectors/asana";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string; organizationId: string }> }
) {
	const { userId, organizationId } = await params;

	try {
		// Step 1: Check for webhook handshake
		const hookSecret = request.headers.get("x-hook-secret");

		if (hookSecret) {
			// This is the initial handshake from Asana
			console.log("Asana webhook handshake received");

			// Respond with the same secret to complete handshake
			return new NextResponse(null, {
				status: 200,
				headers: {
					"X-Hook-Secret": hookSecret,
				},
			});
		}

		// Step 2: Get integration from database
		const integration = await prisma.integration.findFirst({
			where: {
				userId,
				organizationId,
				toolName: "asana",
				status: { in: ["CONNECTED", "SYNCING"] },
			},
		});

		if (!integration) {
			console.warn("Asana webhook received for unknown integration", {
				userId,
				organizationId,
			});
			return NextResponse.json(
				{ error: "Integration not found" },
				{ status: 404 }
			);
		}

		// Step 3: Verify webhook signature (optional but recommended)
		const signature = request.headers.get("x-hook-signature");
		if (signature && integration.webhookSecret) {
			const body = await request.text();
			const webhookSecret = integration.webhookSecret;

			const expectedSignature = crypto
				.createHmac("sha256", webhookSecret)
				.update(body)
				.digest("hex");

			if (signature !== expectedSignature) {
				console.warn("Asana webhook signature verification failed");
				return NextResponse.json(
					{ error: "Invalid signature" },
					{ status: 401 }
				);
			}

			// Re-parse body as JSON
			const payload = JSON.parse(body);
			await processAsanaWebhook(payload, integration, organizationId);
		} else {
			// No signature verification
			const payload = await request.json();
			await processAsanaWebhook(payload, integration, organizationId);
		}

		// Step 4: Update last sync time
		await prisma.integration.update({
			where: { id: integration.id },
			data: { lastSyncAt: new Date() },
		});

		// Step 5: Return success
		return NextResponse.json({ received: true }, { status: 200 });
	} catch (error) {
		console.error("Asana webhook processing error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// ============================================================================
// WEBHOOK EVENT PROCESSING
// ============================================================================

interface AsanaWebhookPayload {
	events: Array<{
		action: "changed" | "added" | "removed" | "deleted" | "undeleted";
		created_at: string;
		parent: {
			gid: string;
			resource_type: string;
			name?: string;
		} | null;
		resource: {
			gid: string;
			resource_type: string;
			name?: string;
		};
		type: string;
		user: {
			gid: string;
			resource_type: string;
			name?: string;
		};
		change?: {
			field: string;
			action: string;
			new_value?: any;
			old_value?: any;
		};
	}>;
}

async function processAsanaWebhook(
	payload: AsanaWebhookPayload,
	integration: any,
	organizationId: string
): Promise<void> {
	console.log(
		`Processing ${payload.events?.length || 0} Asana webhook events`
	);

	if (!payload.events || payload.events.length === 0) {
		console.warn("No events in Asana webhook payload");
		return;
	}

	for (const event of payload.events) {
		try {
			await processAsanaEvent(event, integration, organizationId);
		} catch (error) {
			console.error(`Failed to process Asana event:`, error, event);
			// Continue processing other events
		}
	}
}

/**
 * Process individual Asana event
 */
async function processAsanaEvent(
	event: AsanaWebhookPayload["events"][0],
	integration: any,
	organizationId: string
): Promise<void> {
	const { action, resource, parent } = event;

	console.log(
		`Processing Asana event: ${action} ${resource.resource_type} ${resource.gid}`
	);

	// Handle different resource types
	switch (resource.resource_type) {
		case "task":
			await handleTaskEvent(event, integration, organizationId);
			break;

		case "project":
			await handleProjectEvent(event, integration, organizationId);
			break;

		case "story":
			// Stories are comments/activity - can be logged but not critical
			console.log(
				`Story event (comment/activity) on task ${parent?.gid}`
			);
			break;

		default:
			console.log(`Unhandled resource type: ${resource.resource_type}`);
	}
}

/**
 * Handle task-related events
 */
async function handleTaskEvent(
	event: AsanaWebhookPayload["events"][0],
	integration: any,
	organizationId: string
): Promise<void> {
	const { action, resource, change } = event;
	const taskGid = resource.gid;

	// Get API key and fetch task details
	const apiKey = integration.apiKey;

	try {
		const connector = new AsanaConnector(apiKey);

		switch (action) {
			case "added":
				// New task created
				console.log(`New task added: ${taskGid}`);
				await syncTaskFromAsana(connector, taskGid, organizationId);
				break;

			case "changed":
				// Task updated
				console.log(`Task changed: ${taskGid}`, change);
				await syncTaskFromAsana(connector, taskGid, organizationId);
				break;

			case "removed":
			case "deleted":
				// Task deleted or removed from project
				console.log(`Task removed/deleted: ${taskGid}`);
				await markTaskDeleted(taskGid, organizationId);
				break;

			case "undeleted":
				// Task restored
				console.log(`Task undeleted: ${taskGid}`);
				await syncTaskFromAsana(connector, taskGid, organizationId);
				break;
		}
	} catch (error) {
		console.error(`Failed to handle task event for ${taskGid}:`, error);
		throw error;
	}
}

/**
 * Handle project-related events
 */
async function handleProjectEvent(
	event: AsanaWebhookPayload["events"][0],
	integration: any,
	organizationId: string
): Promise<void> {
	const { action, resource } = event;
	const projectGid = resource.gid;

	console.log(`Project event: ${action} ${projectGid}`);

	const apiKey = integration.apiKey;
	const connector = new AsanaConnector(apiKey);

	try {
		switch (action) {
			case "added":
			case "changed":
				// Fetch project details and update
				const project = await connector.getProject(projectGid);

				if (project) {
					await prisma.project.upsert({
						where: {
							externalId_sourceTool: {
								externalId: project.externalId,
								sourceTool: "asana",
							},
						},
						create: {
							organizationId,
							externalId: project.externalId,
							sourceTool: "asana",
							name: project.name,
							description: project.description,
							attributes: project.attributes,
							status: project.attributes.archived
								? "archived"
								: "active",
						},
						update: {
							name: project.name,
							description: project.description,
							attributes: project.attributes,
							status: project.attributes.archived
								? "archived"
								: "active",
						},
					});
				}
				break;

			case "removed":
			case "deleted":
				// Mark project as archived
				await prisma.project.updateMany({
					where: {
						externalId: projectGid,
						sourceTool: "asana",
						organizationId,
					},
					data: {
						status: "archived",
					},
				});
				break;
		}
	} catch (error) {
		console.error(
			`Failed to handle project event for ${projectGid}:`,
			error
		);
	}
}

/**
 * Sync task from Asana API
 */
async function syncTaskFromAsana(
	connector: any,
	taskGid: string,
	organizationId: string
): Promise<void> {
	try {
		const task = await connector.getTask(taskGid);

		// Find the project this task belongs to
		const project = await prisma.project.findFirst({
			where: {
				organizationId,
				sourceTool: "asana",
				status: "active",
			},
		});

		if (!project) {
			console.warn(`No active Asana project found for task ${taskGid}`);
			return;
		}

		await prisma.task.upsert({
			where: {
				externalId_sourceTool: {
					externalId: task.externalId,
					sourceTool: "asana",
				},
			},
			create: {
				organizationId,
				projectId: project.id,
				externalId: task.externalId,
				sourceTool: "asana",
				title: task.title,
				description: task.description,
				status: task.status,
				assignee: task.assignee,
				assigneeId: task.assigneeId,
				priority: task.priority,
				url: task.url,
				dueDate: task.dueDate ? new Date(task.dueDate) : null,
				labels: task.labels,
				attributes: task.attributes,
				lastSyncedAt: new Date(),
			},
			update: {
				title: task.title,
				description: task.description,
				status: task.status,
				assignee: task.assignee,
				assigneeId: task.assigneeId,
				priority: task.priority,
				url: task.url,
				dueDate: task.dueDate ? new Date(task.dueDate) : null,
				labels: task.labels,
				attributes: task.attributes,
				lastSyncedAt: new Date(),
			},
		});

		console.log(`Task ${taskGid} synced successfully`);
	} catch (error) {
		console.error(`Failed to sync task ${taskGid}:`, error);
		throw error;
	}
}

/**
 * Mark task as deleted
 */
async function markTaskDeleted(
	taskGid: string,
	organizationId: string
): Promise<void> {
	try {
		await prisma.task.updateMany({
			where: {
				externalId: taskGid,
				sourceTool: "asana",
				organizationId,
			},
			data: {
				attributes: {
					deleted: true,
					deletedAt: new Date().toISOString(),
				},
			},
		});

		console.log(`Task ${taskGid} marked as deleted`);
	} catch (error) {
		console.error(`Failed to mark task ${taskGid} as deleted:`, error);
	}
}

// ============================================================================
// GET HANDLER (For webhook verification)
// ============================================================================

/**
 * GET handler - For webhook endpoint verification
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string; organizationId: string }> }
) {
	const { userId, organizationId } = await params;
	return NextResponse.json(
		{
			status: "ok",
			message: "Asana webhook endpoint",
			userId,
			organizationId,
		},
		{ status: 200 }
	);
}
