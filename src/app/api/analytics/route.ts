import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";
import { getEvents } from "@/server/categories/analytics";

// Define query parameter schema for validation
const QuerySchema = z.object({
	range: z.enum(["24h", "7d", "30d", "90d"]).default("7d"),
});

// Define the time range to date range mapping
const getDateRange = (range: string): Date => {
	const now = new Date();
	switch (range) {
		case "24h":
			return new Date(now.getTime() - 24 * 60 * 60 * 1000);
		case "7d":
			return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		case "30d":
			return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		case "90d":
			return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
		default:
			return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	}
};

export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			// Parse and validate query parameters
			const { searchParams } = new URL(request.url);
			const parsedParams = QuerySchema.safeParse({
				range: searchParams.get("range"),
			});

			if (!parsedParams.success) {
				return NextResponse.json(
					{
						error: "Invalid query parameters",
						details: parsedParams.error,
					},
					{ status: 400 }
				);
			}

			const { range } = parsedParams.data;
			const startDate = getDateRange(range);

			// Fetch analytics events from Prisma
			const events = await getEvents(user.organizationId, startDate);

			// Calculate summary metrics
			const totalEvents = events.length;
			const totalPageviews = events.filter(
				(e) => e.eventType === "$pageview"
			).length;
			const uniqueVisitors = new Set(events.map((e) => e.externalId))
				.size;
			const avgSessionDuration =
				events.reduce((sum, e) => sum + (e.duration || 0), 0) /
				events.length || 0;

			// Calculate event types distribution
			const eventTypeCounts = events.reduce(
				(acc, e) => {
					const eventType = e.eventType || "Unknown";
					acc[eventType] = (acc[eventType] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			);

			const eventTypes = Object.entries(eventTypeCounts).map(
				([name, count]) => ({
					name,
					count,
					percentage: Math.round((count / totalEvents) * 100),
				})
			);

			// Calculate device types distribution
			const deviceTypeCounts = events.reduce(
				(acc, e) => {
					const device = e.deviceType || "Unknown";
					acc[device] = (acc[device] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			);

			const deviceTypes = Object.entries(deviceTypeCounts).map(
				([name, count]) => ({
					name,
					count,
					percentage: Math.round((count / totalEvents) * 100),
				})
			);

			// Calculate top pages
			const pageViewCounts = events
				.filter((e) => e.eventType === "$pageview")
				.reduce(
					(acc, e) => {
						if (!e.pathname) return acc;
						if (!acc[e.pathname]) {
							acc[e.pathname] = {
								count: 0,
								totalDuration: 0,
							};
						}
						acc[e.pathname].count++;
						acc[e.pathname].totalDuration += e.duration || 0;
						return acc;
					},
					{} as Record<string, { count: number; totalDuration: number }>
				);

			const topPages = Object.entries(pageViewCounts)
				.map(([pathname, data]) => ({
					pathname,
					pageviews: data.count,
					avgDuration: Math.round(data.totalDuration / data.count),
				}))
				.sort((a, b) => b.pageviews - a.pageviews)
				.slice(0, 10);

			// Calculate top referrers
			const referrerCounts = events.reduce(
				(acc, e) => {
					const domain = e.referringDomain || "Direct";
					acc[domain] = (acc[domain] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			);

			const topReferrers = Object.entries(referrerCounts)
				.map(([referringDomain, count]) => ({
					referringDomain,
					count,
					percentage: Math.round((count / totalEvents) * 100),
				}))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			// Calculate geographic metrics
			const geoCounts = events.reduce(
				(acc, e) => {
					const key = `${e.geoipCountryName || "Unknown"}_${e.geoipCountryCode || ""}`;
					if (!acc[key]) {
						acc[key] = {
							geoipCountryName: e.geoipCountryName || "Unknown",
							geoipCountryCode: e.geoipCountryCode || "",
							count: 0,
						};
					}
					acc[key].count++;
					return acc;
				},
				{} as Record<string, { geoipCountryName: string; geoipCountryCode: string; count: number }>
			);

			const geoMetrics = Object.values(geoCounts)
				.map((geo) => ({
					...geo,
					percentage: Math.round((geo.count / totalEvents) * 100),
				}))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			// Calculate browser languages
			const languageCounts = events.reduce(
				(acc, e) => {
					const lang = e.browserLanguagePrefix || "Unknown";
					acc[lang] = (acc[lang] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>
			);

			const browserLanguages = Object.entries(languageCounts)
				.map(([language, count]) => ({
					language,
					count,
					percentage: Math.round((count / totalEvents) * 100),
				}))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			// Calculate event trends (group by day)
			const trendMap = events.reduce(
				(acc, e) => {
					const date = new Date(e.timestamp).toISOString().split("T")[0];
					if (!acc[date]) {
						acc[date] = { pageviews: 0, events: 0 };
					}
					acc[date].events++;
					if (e.eventType === "$pageview") {
						acc[date].pageviews++;
					}
					return acc;
				},
				{} as Record<string, { pageviews: number; events: number }>
			);

			const eventTrends = Object.entries(trendMap)
				.map(([timestamp, data]) => ({
					timestamp,
					...data,
				}))
				.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

			// Generate insight
			const topPage = topPages[0]?.pathname || "N/A";
			const topReferrer = topReferrers[0]?.referringDomain || "Direct";
			const insight = `Your most visited page is "${topPage}" with ${topPages[0]?.pageviews || 0} views. Most traffic comes from ${topReferrer}. You have ${uniqueVisitors} unique visitors with an average session duration of ${avgSessionDuration.toFixed(1)}s.`;

			const analyticsData = {
				timeRange: range,
				summary: {
					totalEvents,
					totalPageviews,
					uniqueVisitors,
					avgSessionDuration,
				},
				eventTypes,
				deviceTypes,
				topPages,
				topReferrers,
				geoMetrics,
				browserLanguages,
				eventTrends,
				insight,
			};

			return NextResponse.json(analyticsData, { status: 200 });
		} catch (error) {
			console.error(
				"[API_ANALYTICS] Error fetching analytics events:",
				error
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	});
}
