/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST handler for PostHog webhooks
 * Route: /api/webhooks/posthog/[organizationId]
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ organizationId: string }> }
) {
	const { organizationId } = await params;

	try {
		// Step 1: Get integration from database
		const integration = await prisma.integration.findFirst({
			where: {
				organizationId,
				toolName: "posthog",
				status: { in: ["CONNECTED", "SYNCING"] },
			},
		});

		if (!integration) {
			console.warn("PostHog webhook received for unknown integration", {
				organizationId,
			});
			return NextResponse.json(
				{ error: "Integration not found" },
				{ status: 404 }
			);
		}

		// Step 2: Parse webhook payload
		const body = await request.json();

		console.log(`Received PostHog webhook:`, {
			event: body.event,
			distinctId: body.distinct_id,
			timestamp: body.timestamp,
		});

		// PostHog webhook structure:
		// {
		//   "event": "$pageview",
		//   "distinct_id": "user123",
		//   "properties": { ... },
		//   "timestamp": "2024-01-01T00:00:00Z",
		//   "uuid": "event-uuid-here"
		// }

		// Step 3: Verify webhook authenticity (optional - PostHog doesn't sign webhooks)
		// You can add a secret token in the webhook URL as query parameter for basic security

		// Step 4: Process webhook event
		await processPostHogWebhook(body, integration, organizationId);

		// Step 5: Update last sync time
		await prisma.integration.update({
			where: { id: integration.id },
			data: { lastSyncAt: new Date() },
		});

		// Step 6: Return success
		return NextResponse.json({ received: true }, { status: 200 });
	} catch (error) {
		console.error("PostHog webhook processing error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// ============================================================================
// WEBHOOK EVENT PROCESSING
// ============================================================================

interface PostHogWebhookPayload {
	event: string;
	distinct_id: string;
	properties: Record<string, any>;
	timestamp: string;
	uuid?: string;
	$set?: Record<string, any>;
	$set_once?: Record<string, any>;
}

async function processPostHogWebhook(
	payload: PostHogWebhookPayload,
	integration: any,
	organizationId: string
): Promise<void> {
	console.log(`Processing PostHog event: ${payload.event}`);

	try {
		// Get associated project
		const projectId = (integration.metadata as any)?.projectId;
		const project = await prisma.project.findFirst({
			where: {
				organizationId,
				externalId: projectId,
				sourceTool: "posthog",
			},
		});

		if (!project) {
			throw new Error("Associated PostHog project not found");
		}

		// Normalize webhook event
		const normalizedEvent = normalizePostHogWebhookEvent(payload);

		// Store event in database
		await prisma.analyticsEvent.create({
			data: {
				sourceTool: "posthog",
				organizationId,
				projectId: project.id,
				externalId: normalizedEvent.externalId,
				eventType: normalizedEvent.eventType,
				referrer: normalizedEvent.referrer,
				referringDomain: normalizedEvent.referringDomain,
				timezone: normalizedEvent.timezone,
				pathname: normalizedEvent.pathname,
				deviceType: normalizedEvent.deviceType,
				browserLanguagePrefix: normalizedEvent.browserLanguagePrefix,
				geoipCityName: normalizedEvent.geoipCityName,
				geoipCountryName: normalizedEvent.geoipCountryName,
				geoipCountryCode: normalizedEvent.geoipCountryCode,
				geoipContinentName: normalizedEvent.geoipContinentName,
				geoipContinentCode: normalizedEvent.geoipContinentCode,
				duration: normalizedEvent.duration,
				timestamp: normalizedEvent.timestamp,
				attributes: normalizedEvent.attributes,
			},
		});

		console.log(`PostHog event ${payload.event} stored successfully`);
	} catch (error) {
		console.error(`Failed to process PostHog webhook event:`, error);
		throw error;
	}
}

/**
 * Normalize PostHog webhook event to database format
 */
function normalizePostHogWebhookEvent(payload: PostHogWebhookPayload): {
	externalId: string;
	eventType: string;
	referrer?: string;
	referringDomain?: string;
	timezone?: string;
	pathname?: string;
	deviceType?: string;
	browserLanguagePrefix?: string;
	geoipCityName?: string;
	geoipCountryName?: string;
	geoipCountryCode?: string;
	geoipContinentName?: string;
	geoipContinentCode?: string;
	duration?: number;
	timestamp: Date;
	attributes: any;
} {
	const properties = payload.properties || {};

	return {
		externalId: payload.uuid || `${payload.distinct_id}-${Date.now()}`,
		eventType: payload.event,
		referrer: properties.$referrer || properties.$initial_referrer,
		referringDomain:
			properties.$referring_domain ||
			properties.$initial_referring_domain,
		timezone: properties.$timezone,
		pathname: properties.$pathname || properties.$current_url,
		deviceType: properties.$device_type,
		browserLanguagePrefix: properties.$browser_language,
		geoipCityName: properties.$geoip_city_name,
		geoipCountryName: properties.$geoip_country_name,
		geoipCountryCode: properties.$geoip_country_code,
		geoipContinentName: properties.$geoip_continent_name,
		geoipContinentCode: properties.$geoip_continent_code,
		duration: properties.$prev_pageview_duration
			? parseFloat(properties.$prev_pageview_duration)
			: undefined,
		timestamp: new Date(payload.timestamp),
		attributes: {
			distinctId: payload.distinct_id,
			browser: properties.$browser,
			browserVersion: properties.$browser_version,
			os: properties.$os,
			osVersion: properties.$os_version,
			screenHeight: properties.$screen_height,
			screenWidth: properties.$screen_width,
			viewport:
				properties.$viewport_height && properties.$viewport_width
					? `${properties.$viewport_width}x${properties.$viewport_height}`
					: undefined,
			lib: properties.$lib,
			libVersion: properties.$lib_version,
			insertId: properties.$insert_id,
			sessionId: properties.$session_id,
			host: properties.$host,
			eventName: properties.$event_name,
			// User properties from $set
			userProperties: payload.$set,
			userPropertiesOnce: payload.$set_once,
			// Custom properties (non-$ prefixed)
			customProperties: Object.keys(properties)
				.filter((key) => !key.startsWith("$"))
				.reduce((acc, key) => ({ ...acc, [key]: properties[key] }), {}),
		},
	};
}

// ============================================================================
// GET HANDLER (For webhook verification)
// ============================================================================

/**
 * GET handler - For webhook endpoint verification
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: { userId: string; organizationId: string } }
) {
	return NextResponse.json(
		{
			status: "ok",
			message: "PostHog webhook endpoint",
			organizationId: params.organizationId,
		},
		{ status: 200 }
	);
}

// ============================================================================
// WEBHOOK SECURITY (Optional Enhancement)
// ============================================================================

/**
 * Add webhook secret token verification
 * Usage: https://yourapp.com/webhooks/posthog/user123/org456?token=secret123
 */
function verifyWebhookToken(request: NextRequest, integration: any): boolean {
	const url = new URL(request.url);
	const token = url.searchParams.get("token");

	if (!token) {
		return false;
	}

	// Compare with stored webhook secret (if using this method)
	const webhookSecret = integration.webhookSecret
		? integration.webhookSecret
		: null;

	return token === webhookSecret;
}
