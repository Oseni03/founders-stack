/* eslint-disable @typescript-eslint/no-explicit-any */
import { getIntegration } from "@/server/integrations";
import { prisma } from "../prisma";

// Interface for normalized data
interface NormalizedAnalyticsEvent {
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
}

// PostHog connector
export class PostHogConnector {
	private baseUrl: string = "https://app.posthog.com/api";
	private apiKey: string;
	private projectId: string;

	constructor(apiKey: string, projectId: string) {
		this.apiKey = apiKey;
		this.projectId = projectId;
	}

	// Normalize PostHog event to NormalizedAnalyticsEvent format
	private normalizeToUserReport(event: any): NormalizedAnalyticsEvent {
		const properties = event.properties || {};

		return {
			externalId: event.id,
			eventType: event.event,
			referrer: properties.$referrer,
			referringDomain: properties.$referring_domain,
			timezone: properties.$timezone,
			pathname: properties.$pathname,
			deviceType: properties.$device_type,
			browserLanguagePrefix: properties.$browser_language_prefix,
			geoipCityName: properties.$geoip_city_name,
			geoipCountryName: properties.$geoip_country_name,
			geoipCountryCode: properties.$geoip_country_code,
			geoipContinentName: properties.$geoip_continent_name,
			geoipContinentCode: properties.$geoip_continent_code,
			duration: properties.$prev_pageview_duration,
			timestamp: new Date(event.timestamp),
		};
	}

	// fetch events from PostHog API
	async getEvents(): Promise<NormalizedAnalyticsEvent[]> {
		try {
			// Fetch events (paginated, last 24h for MVP)
			const response = await fetch(
				`${this.baseUrl}/projects/${this.projectId}/events?event=[$pageview,$pageleave,$exception,$performance_event,$autocapture]&limit=100`,
				{
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
					},
				}
			);

			// Handle authentication errors
			if (response.status === 401) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`PostHog authentication failed: ${errorData.detail || "Invalid API key"}`
				);
			}

			if (!response.ok) {
				throw new Error(
					`PostHog API error: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();
			const events = data.results ?? [];

			// Normalize and save to DB
			const normalized = events.map((event: any) =>
				this.normalizeToUserReport(event)
			);

			return normalized;
		} catch (error) {
			console.error("PostHog events fetching failed:", error);
			throw new Error("Failed to fetch PostHog events");
		}
	}
}

export async function syncPostHog(organizationId: string, projectId?: string) {
	const integration = await getIntegration(organizationId, "posthog");

	if (!integration?.apiKey) {
		throw new Error("Integration not connected");
	}

	let projId: string;

	if (projectId) {
		projId = projectId;
	} else {
		const project = await prisma.project.findFirstOrThrow({
			where: {
				organizationId,
				sourceTool: "posthog",
			},
		});
		projId = project.id;
	}

	const connector = new PostHogConnector(integration.apiKey, projId);

	let events;
	try {
		events = await connector.getEvents();
	} catch (error: any) {
		console.error("Error fetching PostHog events: ", error);
		throw new Error("Error fetching PostHog events");
	}

	if (events && events.length > 0) {
		await prisma.$transaction(async (tx) => {
			await tx.analyticsEvent.createMany({
				data: events.map((event) => ({
					...event,
					sourceTool: "posthog",
					organizationId,
					projectId: projId,
				})),
				skipDuplicates: true,
			});
		});
	}

	return events;
}
