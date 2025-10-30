/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PostHog webhook event structure
interface PostHogWebhookPayload {
	hook: {
		id: string;
		event: string;
		target: string;
	};
	data: {
		event: string;
		distinct_id: string;
		properties: {
			$current_url?: string;
			$pathname?: string;
			$referrer?: string;
			$referring_domain?: string;
			$device_type?: string;
			$browser?: string;
			$browser_version?: string;
			$browser_language?: string;
			$os?: string;
			$os_version?: string;
			$screen_height?: number;
			$screen_width?: number;
			$viewport_height?: number;
			$viewport_width?: number;
			$ip?: string;
			$geoip_city_name?: string;
			$geoip_country_name?: string;
			$geoip_country_code?: string;
			$geoip_continent_name?: string;
			$geoip_continent_code?: string;
			$geoip_latitude?: number;
			$geoip_longitude?: number;
			$timezone?: string;
			$session_id?: string;
			$pageview_id?: string;
			$prev_pageview_pathname?: string;
			duration?: number; // For $pageleave events (in seconds)
			[key: string]: any; // Custom properties
		};
		timestamp: string;
		uuid: string;
		elements?: any[];
		project_id?: number;
		team_id?: number;
	};
}

/**
 * Extract browser language prefix (e.g., "en" from "en-US")
 */
function extractLanguagePrefix(browserLanguage?: string): string | null {
	if (!browserLanguage) return null;
	return browserLanguage.split("-")[0];
}

/**
 * Handle PostHog webhook event and create AnalyticsEvent
 */
async function handlePostHogEvent(
	payload: PostHogWebhookPayload,
	organizationId: string,
	projectId: string | null
) {
	const { data } = payload;
	const { event, properties, timestamp, uuid } = data;

	console.log(`PostHog event received: ${event} (${uuid})`);

	// Check if event already exists to prevent duplicates
	const existingEvent = await prisma.analyticsEvent.findUnique({
		where: {
			externalId_sourceTool: {
				externalId: uuid,
				sourceTool: "posthog",
			},
		},
	});

	if (existingEvent) {
		console.log(`Event ${uuid} already exists, skipping`);
		return;
	}

	// Create AnalyticsEvent entry
	await prisma.analyticsEvent.create({
		data: {
			organizationId,
			externalId: uuid,
			sourceTool: "posthog",
			eventType: event,
			referrer: properties.$referrer || null,
			referringDomain: properties.$referring_domain || null,
			timezone: properties.$timezone || null,
			pathname: properties.$pathname || null,
			deviceType: properties.$device_type || null,
			browserLanguagePrefix: extractLanguagePrefix(
				properties.$browser_language
			),
			geoipCityName: properties.$geoip_city_name || null,
			geoipCountryName: properties.$geoip_country_name || null,
			geoipCountryCode: properties.$geoip_country_code || null,
			geoipContinentName: properties.$geoip_continent_name || null,
			geoipContinentCode: properties.$geoip_continent_code || null,
			duration: properties.duration || null,
			timestamp: new Date(timestamp),
			projectId: projectId,
			attributes: {
				distinctId: data.distinct_id,
				currentUrl: properties.$current_url,
				browser: properties.$browser,
				browserVersion: properties.$browser_version,
				browserLanguage: properties.$browser_language,
				os: properties.$os,
				osVersion: properties.$os_version,
				screen: {
					height: properties.$screen_height,
					width: properties.$screen_width,
				},
				viewport: {
					height: properties.$viewport_height,
					width: properties.$viewport_width,
				},
				geoip: {
					latitude: properties.$geoip_latitude,
					longitude: properties.$geoip_longitude,
				},
				sessionId: properties.$session_id,
				pageviewId: properties.$pageview_id,
				prevPageviewPathname: properties.$prev_pageview_pathname,
				teamId: data.team_id,
				postHogProjectId: data.project_id,
				// Store any custom properties
				customProperties: Object.keys(properties)
					.filter((key) => !key.startsWith("$"))
					.reduce(
						(acc, key) => {
							acc[key] = properties[key];
							return acc;
						},
						{} as Record<string, any>
					),
			},
		},
	});

	console.log(`Created AnalyticsEvent for ${event} (${uuid})`);
}

/**
 * POST /api/webhooks/posthog
 * Handles incoming webhooks from PostHog
 */
export async function POST(request: NextRequest) {
	try {
		// Parse the payload
		const payload: PostHogWebhookPayload = await request.json();

		// Get organizationId from query params or lookup by PostHog project/team ID
		let organizationId = request.nextUrl.searchParams.get("organizationId");
		const projectId: string | null =
			request.nextUrl.searchParams.get("projectId");

		// If organizationId not provided, look it up using PostHog project/team ID
		if (!organizationId && payload.data.project_id) {
			const integration = await prisma.integration.findFirst({
				where: {
					toolName: "posthog",
					apiKey: {
						equals: payload.data.project_id.toString(),
					},
				},
				select: {
					organizationId: true,
				},
			});

			if (integration) {
				organizationId = integration.organizationId;
			}
		}

		if (!organizationId) {
			console.error("No organizationId found for PostHog webhook");
			return NextResponse.json(
				{ error: "Organization not found" },
				{ status: 404 }
			);
		}

		// Handle the event
		await handlePostHogEvent(payload, organizationId, projectId);

		// Return success response
		return NextResponse.json(
			{
				received: true,
				event: payload.data.event,
				uuid: payload.data.uuid,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error processing PostHog webhook:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}

// Optional: Handle GET requests for webhook verification/health check
export async function GET() {
	return NextResponse.json({
		status: "PostHog webhook endpoint is active",
		timestamp: new Date().toISOString(),
	});
}
