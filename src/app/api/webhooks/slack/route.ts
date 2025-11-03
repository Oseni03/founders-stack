import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processSlackEvent } from "@/server/platforms/slack";

export async function POST(request: NextRequest) {
	const body = await request.text();
	const payload = JSON.parse(body);

	// Verify the request is from Slack
	const slackSignature = request.headers.get("x-slack-signature");
	const slackTimestamp = request.headers.get("x-slack-request-timestamp");

	if (!verifySlackRequest(slackSignature!, slackTimestamp!, body)) {
		return NextResponse.json(
			{ error: "Invalid signature" },
			{ status: 401 }
		);
	}

	// Handle URL verification challenge (one-time setup)
	if (payload.type === "url_verification") {
		console.log("URL verification challenge received");
		return NextResponse.json({ challenge: payload.challenge });
	}

	// Handle event callbacks
	if (payload.type === "event_callback") {
		// Process the event asynchronously to respond quickly
		await processSlackEvent(payload).catch((error) => {
			console.error("Error processing Slack event:", error);
		});

		// Respond immediately to Slack (must respond within 3 seconds)
		return NextResponse.json({ ok: true });
	}

	console.log("Unhandled Slack webhook payload: ", payload.type);

	return NextResponse.json({ ok: true });
}

// Verify request is from Slack
function verifySlackRequest(
	signature: string,
	timestamp: string,
	body: string
): boolean {
	const signingSecret = process.env.SLACK_SIGNING_SECRET!;

	// Reject old requests (replay attack prevention)
	const currentTime = Math.floor(Date.now() / 1000);
	if (Math.abs(currentTime - parseInt(timestamp)) > 60 * 5) {
		console.log("Request too old");
		return false;
	}

	// Compute the signature
	const sigBasestring = `v0:${timestamp}:${body}`;
	const mySignature =
		"v0=" +
		crypto
			.createHmac("sha256", signingSecret)
			.update(sigBasestring)
			.digest("hex");

	// Compare signatures
	try {
		return crypto.timingSafeEqual(
			Buffer.from(mySignature),
			Buffer.from(signature)
		);
	} catch {
		return false;
	}
}
