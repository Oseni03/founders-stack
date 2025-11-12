import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma"; // Adjust import based on your setup
import { processGitHubEvent } from "@/server/platforms/github";
import { logger } from "@/lib/logger";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ repositoryId: string }> }
) {
	const startTime = Date.now();
	const { repositoryId } = await params;

	const body = await request.text();
	const signature = request.headers.get("x-hub-signature-256");
	const event = request.headers.get("x-github-event");
	const deliveryId = request.headers.get("x-github-delivery");

	logger.info(`[${new Date().toISOString()}] GitHub webhook received`, {
		event,
		deliveryId,
		repositoryId,
	});

	// Verify the webhook signature
	if (!signature || !verifyGitHubSignature(signature, body)) {
		logger.error(`[${new Date().toISOString()}] Invalid GitHub signature`, {
			event,
			deliveryId,
			repositoryId,
		});
		return NextResponse.json(
			{ error: "Invalid signature" },
			{ status: 401 }
		);
	}

	let payload;
	try {
		payload = JSON.parse(body);
	} catch (error) {
		logger.error(
			`[${new Date().toISOString()}] Failed to parse webhook payload`,
			{
				event,
				deliveryId,
				repositoryId,
				error,
			}
		);
		return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
	}

	try {
		logger.info(`[${new Date().toISOString()}] GitHub webhook payload`, {
			event,
			deliveryId,
			repositoryId,
			payload: {
				repository: payload.repository?.full_name,
				action: payload.action,
			},
		});

		// Fetch repository using repositoryId
		const repository = await prisma.repository.findUnique({
			where: { id: repositoryId },
		});

		if (!repository) {
			logger.warn(
				`[${new Date().toISOString()}] Repository not found for ID: ${repositoryId}`,
				{
					event,
					deliveryId,
					payload: { repository: payload.repository?.full_name },
				}
			);
			return NextResponse.json(
				{ error: "Repository not found" },
				{ status: 404 }
			);
		}

		// Process the webhook event
		await processGitHubEvent(event!, payload, repository);

		const duration = Date.now() - startTime;
		logger.info(
			`[${new Date().toISOString()}] GitHub webhook processed successfully in ${duration}ms`,
			{
				event,
				deliveryId,
				repositoryId,
			}
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		const errorMsg =
			error instanceof Error ? error.message : "Internal server error";
		logger.error(
			`[${new Date().toISOString()}] Error processing GitHub webhook`,
			{
				event,
				deliveryId,
				repositoryId,
				error: errorMsg,
			}
		);
		return NextResponse.json({ error: errorMsg }, { status: 500 });
	}
}

// Verify GitHub webhook signature
function verifyGitHubSignature(signature: string, body: string): boolean {
	const secret = process.env.GITHUB_WEBHOOK_SECRET!;
	if (!secret) {
		logger.error(
			`[${new Date().toISOString()}] GITHUB_WEBHOOK_SECRET not configured`
		);
		return false;
	}

	const hmac = crypto.createHmac("sha256", secret);
	const digest = "sha256=" + hmac.update(body).digest("hex");

	try {
		return crypto.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(digest)
		);
	} catch {
		return false;
	}
}
