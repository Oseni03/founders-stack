import { prisma } from "./prisma";

interface PostHogEvent {
	uuid: string;
	event: string;
	timestamp: string;
	distinct_id: string;
	properties: {
		$current_url?: string;
		$pathname?: string;
		$referrer?: string;
		$referring_domain?: string;
		$device_type?: string;
		$browser_language?: string;
		$geoip_city_name?: string;
		$geoip_country_name?: string;
		$geoip_country_code?: string;
		$geoip_continent_name?: string;
		$geoip_continent_code?: string;
		$session_duration?: number;
		[key: string]: any;
	};
}

/**
 * Sync events from PostHog to database
 */
export async function syncPostHogEvents(
	organizationId: string,
	events: PostHogEvent[]
) {
	try {
		const results = await Promise.allSettled(
			events.map((event) =>
				prisma.analyticsEvent.upsert({
					where: {
						externalId_sourceTool: {
							externalId: event.uuid,
							sourceTool: "postHog",
						},
					},
					update: {
						eventType: event.event,
						pathname: event.properties.$pathname || null,
						referrer: event.properties.$referrer || null,
						referringDomain:
							event.properties.$referring_domain || null,
						deviceType: event.properties.$device_type || null,
						browserLanguagePrefix:
							event.properties.$browser_language?.split("-")[0] ||
							null,
						geoipCityName:
							event.properties.$geoip_city_name || null,
						geoipCountryName:
							event.properties.$geoip_country_name || null,
						geoipCountryCode:
							event.properties.$geoip_country_code || null,
						geoipContinentName:
							event.properties.$geoip_continent_name || null,
						geoipContinentCode:
							event.properties.$geoip_continent_code || null,
						duration: event.properties.$session_duration || null,
						timestamp: new Date(event.timestamp),
						attributes: {
							distinct_id: event.distinct_id,
							...event.properties,
						},
						updatedAt: new Date(),
					},
					create: {
						organizationId,
						externalId: event.uuid,
						sourceTool: "postHog",
						eventType: event.event,
						pathname: event.properties.$pathname || null,
						referrer: event.properties.$referrer || null,
						referringDomain:
							event.properties.$referring_domain || null,
						deviceType: event.properties.$device_type || null,
						browserLanguagePrefix:
							event.properties.$browser_language?.split("-")[0] ||
							null,
						geoipCityName:
							event.properties.$geoip_city_name || null,
						geoipCountryName:
							event.properties.$geoip_country_name || null,
						geoipCountryCode:
							event.properties.$geoip_country_code || null,
						geoipContinentName:
							event.properties.$geoip_continent_name || null,
						geoipContinentCode:
							event.properties.$geoip_continent_code || null,
						duration: event.properties.$session_duration || null,
						timestamp: new Date(event.timestamp),
						attributes: {
							distinct_id: event.distinct_id,
							...event.properties,
						},
					},
				})
			)
		);

		const successful = results.filter(
			(r) => r.status === "fulfilled"
		).length;
		const failed = results.filter((r) => r.status === "rejected").length;

		return {
			success: true,
			synced: successful,
			failed,
		};
	} catch (error) {
		console.error("[Analytics Sync] Error:", error);
		throw error;
	}
}

/**
 * Sync events from Google Analytics
 */
export async function syncGoogleAnalyticsEvents(
	organizationId: string,
	events: Array<{
		eventId: string;
		eventName: string;
		eventTimestamp: string;
		userId?: string;
		sessionId?: string;
		pageLocation?: string;
		pagePath?: string;
		pageReferrer?: string;
		deviceCategory?: string;
		country?: string;
		city?: string;
		language?: string;
	}>
) {
	try {
		const results = await Promise.allSettled(
			events.map((event) =>
				prisma.analyticsEvent.upsert({
					where: {
						externalId_sourceTool: {
							externalId: event.eventId,
							sourceTool: "google-analytics",
						},
					},
					update: {
						eventType: event.eventName,
						pathname: event.pagePath || null,
						referrer: event.pageReferrer || null,
						deviceType: event.deviceCategory || null,
						browserLanguagePrefix:
							event.language?.split("-")[0] || null,
						geoipCityName: event.city || null,
						geoipCountryName: event.country || null,
						timestamp: new Date(
							parseInt(event.eventTimestamp) / 1000
						),
						attributes: {
							userId: event.userId,
							sessionId: event.sessionId,
							pageLocation: event.pageLocation,
						},
						updatedAt: new Date(),
					},
					create: {
						organizationId,
						externalId: event.eventId,
						sourceTool: "google-analytics",
						eventType: event.eventName,
						pathname: event.pagePath || null,
						referrer: event.pageReferrer || null,
						deviceType: event.deviceCategory || null,
						browserLanguagePrefix:
							event.language?.split("-")[0] || null,
						geoipCityName: event.city || null,
						geoipCountryName: event.country || null,
						timestamp: new Date(
							parseInt(event.eventTimestamp) / 1000
						),
						attributes: {
							userId: event.userId,
							sessionId: event.sessionId,
							pageLocation: event.pageLocation,
						},
					},
				})
			)
		);

		const successful = results.filter(
			(r) => r.status === "fulfilled"
		).length;
		const failed = results.filter((r) => r.status === "rejected").length;

		return {
			success: true,
			synced: successful,
			failed,
		};
	} catch (error) {
		console.error("[GA Sync] Error:", error);
		throw error;
	}
}

/**
 * Get analytics summary for a date range
 */
export async function getAnalyticsSummary(
	organizationId: string,
	startDate: Date,
	endDate: Date
) {
	const events = await prisma.analyticsEvent.findMany({
		where: {
			organizationId,
			timestamp: {
				gte: startDate,
				lte: endDate,
			},
		},
		select: {
			eventType: true,
			deviceType: true,
			geoipCountryName: true,
			duration: true,
			attributes: true,
		},
	});

	const totalEvents = events.length;
	const pageviews = events.filter((e) => e.eventType === "$pageview").length;

	const uniqueVisitors = new Set(
		events
			.map((e) => {
				const attrs = e.attributes as any;
				return attrs?.distinct_id || attrs?.userId;
			})
			.filter(Boolean)
	).size;

	const avgDuration =
		events
			.filter((e) => e.duration !== null)
			.reduce((sum, e) => sum + (e.duration || 0), 0) / events.length ||
		0;

	return {
		totalEvents,
		pageviews,
		uniqueVisitors,
		avgDuration,
		startDate,
		endDate,
	};
}

/**
 * Get event breakdown by type
 */
export async function getEventTypeBreakdown(
	organizationId: string,
	startDate: Date,
	endDate: Date
) {
	const events = await prisma.analyticsEvent.groupBy({
		by: ["eventType"],
		where: {
			organizationId,
			timestamp: {
				gte: startDate,
				lte: endDate,
			},
		},
		_count: {
			eventType: true,
		},
		orderBy: {
			_count: {
				eventType: "desc",
			},
		},
	});

	const total = events.reduce((sum, e) => sum + e._count.eventType, 0);

	return events.map((e) => ({
		eventType: e.eventType || "unknown",
		count: e._count.eventType,
		percentage: ((e._count.eventType / total) * 100).toFixed(2),
	}));
}

/**
 * Get top pages by views
 */
export async function getTopPages(
	organizationId: string,
	startDate: Date,
	endDate: Date,
	limit: number = 10
) {
	const events = await prisma.analyticsEvent.findMany({
		where: {
			organizationId,
			eventType: "$pageview",
			timestamp: {
				gte: startDate,
				lte: endDate,
			},
			pathname: {
				not: null,
			},
		},
		select: {
			pathname: true,
			duration: true,
		},
	});

	const pageMap = new Map<string, { count: number; durations: number[] }>();

	events.forEach((event) => {
		if (event.pathname) {
			const existing = pageMap.get(event.pathname) || {
				count: 0,
				durations: [],
			};
			existing.count++;
			if (event.duration !== null) {
				existing.durations.push(event.duration);
			}
			pageMap.set(event.pathname, existing);
		}
	});

	return Array.from(pageMap.entries())
		.map(([pathname, data]) => ({
			pathname,
			views: data.count,
			avgDuration:
				data.durations.length > 0
					? data.durations.reduce((sum, d) => sum + d, 0) /
						data.durations.length
					: 0,
		}))
		.sort((a, b) => b.views - a.views)
		.slice(0, limit);
}

/**
 * Delete old analytics events (data retention)
 */
export async function deleteOldAnalytics(
	organizationId: string,
	olderThanDays: number
) {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

	const result = await prisma.analyticsEvent.deleteMany({
		where: {
			organizationId,
			timestamp: {
				lt: cutoffDate,
			},
		},
	});

	return {
		deleted: result.count,
		cutoffDate,
	};
}

/**
 * Track custom event
 */
export async function trackCustomEvent(
	organizationId: string,
	eventData: {
		eventType: string;
		pathname?: string;
		referrer?: string;
		deviceType?: string;
		metadata?: Record<string, any>;
	}
) {
	const event = await prisma.analyticsEvent.create({
		data: {
			organizationId,
			externalId: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			sourceTool: "custom",
			eventType: eventData.eventType,
			pathname: eventData.pathname || null,
			referrer: eventData.referrer || null,
			deviceType: eventData.deviceType || null,
			timestamp: new Date(),
			attributes: eventData.metadata || {},
		},
	});

	return event;
}
