/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Canny webhook event types
type CannyEventType =
	| "post.created"
	| "post.deleted"
	| "post.status_changed"
	| "post.jira_issue_linked"
	| "comment.created"
	| "comment.deleted"
	| "vote.created"
	| "vote.deleted";

interface CannyWebhookPayload {
	type: CannyEventType;
	object: any; // The actual data varies by event type
	objectType: "post" | "comment" | "vote";
	created: string; // ISO 8601 timestamp
}

/**
 * Verify Canny webhook signature
 * Canny signs webhooks with HMAC SHA256
 */
function verifyCannySignature(request: NextRequest, APIKey: string): boolean {
	const nonce = request.headers.get("canny-nonce");
	const signature = request.headers.get("canny-signature");

	if (!nonce || !signature) return false;

	const calculated = crypto
		.createHmac("sha256", APIKey)
		.update(nonce)
		.digest("base64");

	return signature === calculated;
}

/**
 * Handle different Canny event types and update Feed
 */
async function handleCannyEvent(
	payload: CannyWebhookPayload,
	organizationId: string,
	projectId: string
) {
	const { type, object } = payload;

	switch (type) {
		case "post.created":
			console.log("New post created:", object);
			// Create new Feed entry
			await prisma.feed.create({
				data: {
					organizationId,
					externalId: object.id,
					sourceTool: "canny",
					title: object.title || "Untitled Post",
					description: object.details || null,
					author: object.author?.name || null,
					authorId: object.author?.id || null,
					owner: object.owner?.name || null,
					ownerId: object.owner?.id || null,
					category: object.category?.name || null,
					url: object.url || null,
					tags: object.tags?.map((tag: any) => tag.name) || [],
					score: object.score || 0,
					commentsCount: object.commentCount || 0,
					status: object.status || "open",
					attributes: {
						board: object.board?.name,
						boardId: object.board?.id,
						imageURLs: object.imageURLs || [],
						createdBy: object.author?.email,
						voters: object.voters || [],
					},
					projectId,
				},
			});
			break;

		case "post.deleted":
			console.log("Post deleted:", object);
			// Delete Feed entry
			await prisma.feed.deleteMany({
				where: {
					externalId: object.id,
					sourceTool: "canny",
					organizationId,
				},
			});
			break;

		case "post.status_changed":
			console.log("Post status changed:", object);
			// Update Feed status
			await prisma.feed.updateMany({
				where: {
					externalId: object.id,
					sourceTool: "canny",
					organizationId,
				},
				data: {
					status: object.status,
					updatedAt: new Date(),
				},
			});
			break;

		case "post.jira_issue_linked":
			console.log("Jira issue linked:", object);
			// Update Feed attributes with Jira info
			await prisma.feed.updateMany({
				where: {
					externalId: object.id,
					sourceTool: "canny",
					organizationId,
				},
				data: {
					attributes: {
						...(object.attributes || {}),
						jiraIssue: {
							key: object.jiraIssue?.key,
							url: object.jiraIssue?.url,
							linkedAt: new Date().toISOString(),
						},
					},
					updatedAt: new Date(),
				},
			});
			break;

		case "comment.created":
			console.log("New comment created:", object);
			// Update comments count on the post
			const post = await prisma.feed.findFirst({
				where: {
					externalId: object.postID,
					sourceTool: "canny",
					organizationId,
				},
			});

			if (post) {
				await prisma.feed.update({
					where: { id: post.id },
					data: {
						commentsCount: (post.commentsCount || 0) + 1,
						updatedAt: new Date(),
					},
				});
			}
			break;

		case "comment.deleted":
			console.log("Comment deleted:", object);
			// Decrease comments count
			const postForDelete = await prisma.feed.findFirst({
				where: {
					externalId: object.postID,
					sourceTool: "canny",
					organizationId,
				},
			});

			if (postForDelete && (postForDelete.commentsCount || 0) > 0) {
				await prisma.feed.update({
					where: { id: postForDelete.id },
					data: {
						commentsCount: (postForDelete.commentsCount || 0) - 1,
						updatedAt: new Date(),
					},
				});
			}
			break;

		case "vote.created":
			console.log("New vote created:", object);
			// Update vote score
			const postForVote = await prisma.feed.findFirst({
				where: {
					externalId: object.postID,
					sourceTool: "canny",
					organizationId,
				},
			});

			if (postForVote) {
				await prisma.feed.update({
					where: { id: postForVote.id },
					data: {
						score: (postForVote.score || 0) + 1,
						updatedAt: new Date(),
					},
				});
			}
			break;

		case "vote.deleted":
			console.log("Vote deleted:", object);
			// Decrease vote score
			const postForVoteDelete = await prisma.feed.findFirst({
				where: {
					externalId: object.postID,
					sourceTool: "canny",
					organizationId,
				},
			});

			if (postForVoteDelete && (postForVoteDelete.score || 0) > 0) {
				await prisma.feed.update({
					where: { id: postForVoteDelete.id },
					data: {
						score: (postForVoteDelete.score || 0) - 1,
						updatedAt: new Date(),
					},
				});
			}
			break;

		default:
			console.log("Unknown event type:", type);
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ organizationId: string }> }
) {
	try {
		const { organizationId } = await params;
		const integration = await prisma.integration.findFirst({
			where: {
				organizationId,
				toolName: "canny",
				status: { in: ["CONNECTED", "SYNCING"] },
			},
		});

		if (!integration?.apiKey) {
			return NextResponse.json(
				{ error: "Canny not integrated!" },
				{ status: 404 }
			);
		}
		// Get raw body as text for signature verification
		const rawBody = await request.text();

		// Verify the webhook signature
		const isValid = verifyCannySignature(request, integration.apiKey);

		if (!isValid) {
			console.error("Invalid webhook signature");
			return NextResponse.json(
				{ error: "Invalid webhook signature" },
				{ status: 401 }
			);
		}

		// Parse the payload
		const payload: CannyWebhookPayload = JSON.parse(rawBody);

		// Extract Canny board ID from the webhook payload
		const cannyBoardId = payload.object?.board?.id;

		if (!cannyBoardId) {
			console.error("No board ID found in webhook payload");
			return NextResponse.json(
				{ error: "Missing board ID in payload" },
				{ status: 400 }
			);
		}

		// Look up the project by Canny board ID
		const project = await prisma.project.findFirst({
			where: {
				externalId: cannyBoardId,
				sourceTool: "canny",
				organizationId,
			},
			select: {
				id: true,
				organizationId: true,
			},
		});

		if (!project) {
			console.error(
				`No project found for Canny board ID: ${cannyBoardId}`
			);
			return NextResponse.json(
				{ error: "Project not found for this Canny board" },
				{ status: 404 }
			);
		}

		const { id: projectId } = project;

		// Handle the event
		await handleCannyEvent(payload, organizationId, projectId);

		// Return success response
		return NextResponse.json(
			{ received: true, type: payload.type },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing Canny webhook:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}

// Optional: Handle GET requests for webhook verification/health check
export async function GET() {
	return NextResponse.json({
		status: "Canny webhook endpoint is active",
		timestamp: new Date().toISOString(),
	});
}
