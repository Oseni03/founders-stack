/* eslint-disable @typescript-eslint/no-explicit-any */
export interface NormalizedAnalyticsEvent {
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
	attributes?: any;
}

export class PostHogConnector {
	private baseUrl: string = "https://app.posthog.com/api";
	private apiKey: string;
	private projectId: string;

	constructor(apiKey: string, projectId: string) {
		this.apiKey = apiKey;
		this.projectId = projectId;
	}

	/**
	 * Test connection and get project info
	 */
	async testConnection(): Promise<{
		projectId: string;
		projectName: string;
		organizationId: string;
		organizationName: string;
	}> {
		try {
			const response = await fetch(
				`${this.baseUrl}/projects/${this.projectId}`,
				{
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
					},
				}
			);

			if (response.status === 401) {
				throw new Error("Invalid PostHog API key");
			}

			if (!response.ok) {
				throw new Error(`PostHog API error: ${response.status}`);
			}

			const project = await response.json();

			return {
				projectId: project.id.toString(),
				projectName: project.name,
				organizationId: project.organization,
				organizationName: project.organization_name || "Unknown",
			};
		} catch (error) {
			console.error("PostHog connection test failed:", error);
			throw new Error("Failed to connect to PostHog");
		}
	}

	/**
	 * Create webhook in PostHog
	 * Note: PostHog webhooks are called "Actions" with webhooks as destinations
	 */
	async createWebhook(webhookUrl: string): Promise<{
		id: string;
		name: string;
		url: string;
		enabled: boolean;
	}> {
		try {
			// Create a webhook action in PostHog
			const response = await fetch(
				`${this.baseUrl}/projects/${this.projectId}/hooks/`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						target: webhookUrl,
						event: "action_performed", // Trigger on any action
						resource_id: null, // null means all actions
						enabled: true,
					}),
				}
			);

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				throw new Error(
					`Failed to create webhook: ${JSON.stringify(error)}`
				);
			}

			const webhook = await response.json();

			return {
				id: webhook.id,
				name: webhook.name || "Stack Management App Webhook",
				url: webhook.target,
				enabled: webhook.enabled,
			};
		} catch (error) {
			console.error("Failed to create PostHog webhook:", error);
			throw error;
		}
	}

	/**
	 * Delete webhook from PostHog
	 */
	async deleteWebhook(webhookId: string): Promise<void> {
		try {
			const response = await fetch(
				`${this.baseUrl}/projects/${this.projectId}/hooks/${webhookId}/`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
					},
				}
			);

			if (!response.ok && response.status !== 404) {
				throw new Error(`Failed to delete webhook: ${response.status}`);
			}
		} catch (error) {
			console.error("Failed to delete PostHog webhook:", error);
			throw error;
		}
	}

	/**
	 * Normalize PostHog event to standardized format
	 */
	private normalizeEvent(event: any): NormalizedAnalyticsEvent {
		const properties = event.properties || {};

		return {
			externalId: event.uuid || event.id,
			eventType: event.event,
			referrer: properties.$referrer,
			referringDomain: properties.$referring_domain,
			timezone: properties.$timezone,
			pathname: properties.$pathname || properties.$current_url,
			deviceType: properties.$device_type,
			browserLanguagePrefix: properties.$browser_language_prefix,
			geoipCityName: properties.$geoip_city_name,
			geoipCountryName: properties.$geoip_country_name,
			geoipCountryCode: properties.$geoip_country_code,
			geoipContinentName: properties.$geoip_continent_name,
			geoipContinentCode: properties.$geoip_continent_code,
			duration: properties.$prev_pageview_duration
				? parseFloat(properties.$prev_pageview_duration)
				: undefined,
			timestamp: new Date(event.timestamp),
			attributes: {
				distinctId: event.distinct_id,
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
				customProperties: Object.keys(properties)
					.filter((key) => !key.startsWith("$"))
					.reduce(
						(acc, key) => ({ ...acc, [key]: properties[key] }),
						{}
					),
			},
		};
	}

	/**
	 * Fetch events with pagination support
	 */
	async getEvents(options?: {
		after?: string; // ISO date string
		before?: string;
		limit?: number;
		eventTypes?: string[];
	}): Promise<NormalizedAnalyticsEvent[]> {
		try {
			const limit = options?.limit || 100;
			const events: any[] = [];
			let nextUrl: string | null = null;

			// Build query parameters
			const params = new URLSearchParams({
				limit: limit.toString(),
			});

			// Add event type filters if provided
			if (options?.eventTypes && options.eventTypes.length > 0) {
				params.append("event", JSON.stringify(options.eventTypes));
			}

			// Add date filters
			if (options?.after) {
				params.append("after", options.after);
			}
			if (options?.before) {
				params.append("before", options.before);
			}

			// Fetch first page
			const url = `${this.baseUrl}/projects/${this.projectId}/events/?${params.toString()}`;

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
				},
			});

			if (response.status === 401) {
				throw new Error("PostHog authentication failed");
			}

			if (!response.ok) {
				throw new Error(`PostHog API error: ${response.status}`);
			}

			const data = await response.json();
			events.push(...(data.results || []));
			nextUrl = data.next;

			// Paginate if needed (up to limit)
			while (nextUrl && events.length < limit) {
				const nextResponse = await fetch(nextUrl, {
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
					},
				});

				if (!nextResponse.ok) break;

				const nextData = await nextResponse.json();
				events.push(...(nextData.results || []));
				nextUrl = nextData.next;
			}

			// Normalize events
			return events
				.slice(0, limit)
				.map((event) => this.normalizeEvent(event));
		} catch (error) {
			console.error("Failed to fetch PostHog events:", error);
			throw error;
		}
	}

	/**
	 * Get distinct users count
	 */
	async getActiveUsers(period: "day" | "week" | "month"): Promise<number> {
		try {
			const now = new Date();
			let after: Date;

			switch (period) {
				case "day":
					after = new Date(now.getTime() - 24 * 60 * 60 * 1000);
					break;
				case "week":
					after = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case "month":
					after = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					break;
			}

			// Fetch events in period
			const events = await this.getEvents({
				after: after.toISOString(),
				limit: 10000, // High limit to get all users
			});

			// Count distinct users
			const distinctUsers = new Set(
				events.map((e) => e.attributes?.distinctId).filter(Boolean)
			);

			return distinctUsers.size;
		} catch (error) {
			console.error("Failed to get active users:", error);
			throw error;
		}
	}
}
