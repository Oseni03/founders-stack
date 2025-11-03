import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processGitHubEvent } from "@/server/platforms/github";

export async function POST(request: NextRequest) {
	const body = await request.text();
	const signature = request.headers.get("x-hub-signature-256");
	const event = request.headers.get("x-github-event");
	const deliveryId = request.headers.get("x-github-delivery");

	console.log("GitHub webhook received:", { event, deliveryId });

	// Verify the webhook signature
	if (!verifyGitHubSignature(signature!, body)) {
		console.error("Invalid GitHub signature");
		return NextResponse.json(
			{ error: "Invalid signature" },
			{ status: 401 }
		);
	}

	const payload = JSON.parse(body);

	try {
		// Process the webhook event
		await processGitHubEvent(event!, payload);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error processing GitHub webhook:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// Verify GitHub webhook signature
function verifyGitHubSignature(signature: string, body: string): boolean {
	const secret = process.env.GITHUB_WEBHOOK_SECRET!;

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
