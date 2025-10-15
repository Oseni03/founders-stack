// stores/analyticsStore.ts
import { AnalyticsEvent } from "@prisma/client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Define types based on CDM and analytics needs (PRD Section 6.1, Brainstorming Section 1.A)
interface UserMetrics {
	pageViews: number;
	avgSessionDuration: number;
	uniqueVisitors: number;
}

interface ErrorMetrics {
	errorCount: number;
	errorRate: number;
}

interface GeoMetrics {
	location: string;
	pageViews: number;
}

interface ChartData {
	timestamp: string;
	value: number;
}

export interface AnalyticsState {
	timeRange: string;
	userMetrics: UserMetrics | null;
	errorMetrics: ErrorMetrics | null;
	geoMetrics: GeoMetrics[];
	pageViewTrends: ChartData[];
	sessionDurationTrends: ChartData[];
	errorTrends: ChartData[];
	isLoading: boolean;
	error: string | null;
	setTimeRange: (range: string) => void;
	fetchAnalytics: () => Promise<void>;
}

// Create Zustand store with persistence
export const createAnalyticsStore = () => {
	return create<AnalyticsState>()(
		persist(
			immer((set, get) => ({
				timeRange: "7d",
				userMetrics: null,
				errorMetrics: null,
				geoMetrics: [],
				pageViewTrends: [],
				sessionDurationTrends: [],
				errorTrends: [],
				isLoading: false,
				error: null,

				setTimeRange: (range: string) => set({ timeRange: range }),

				fetchAnalytics: async () => {
					set({ isLoading: true, error: null });
					try {
						const { timeRange } = get();
						const response = await fetch(
							`/api/analytics?range=${timeRange}`,
							{
								headers: { "Content-Type": "application/json" },
							}
						);

						if (!response.ok) {
							throw new Error(`HTTP error ${response.status}`);
						}

						const events: AnalyticsEvent[] = await response.json();

						// Compute metrics (same logic as hook)
						const pageViewEvents = events.filter(
							(e) => e.eventType === "$pageview"
						);
						const pageLeaveEvents = events.filter(
							(e) => e.eventType === "$pageleave"
						);
						const errorEvents = events.filter(
							(e) => e.eventType === "$exception"
						);

						// User Metrics
						const pageViews = pageViewEvents.length;
						const avgSessionDuration =
							pageLeaveEvents.length > 0
								? pageLeaveEvents.reduce(
										(sum, e) => sum + (e.duration || 0),
										0
									) / pageLeaveEvents.length
								: 0;
						const uniqueVisitors = new Set(
							events.map((e) => e.externalId)
						).size;

						// Error Metrics
						const errorCount = errorEvents.length;
						const errorRate =
							pageViews > 0 ? (errorCount / pageViews) * 100 : 0;

						// Geo Metrics
						const geoMap = new Map<string, number>();
						for (const e of pageViewEvents) {
							const location = `${e.geoipCityName || "Unknown"}, ${e.geoipCountryName || "Unknown"}`;
							geoMap.set(
								location,
								(geoMap.get(location) || 0) + 1
							);
						}
						const geoData = Array.from(geoMap.entries())
							.map(([location, pageViews]) => ({
								location,
								pageViews,
							}))
							.sort((a, b) => b.pageViews - a.pageViews);

						// Chart Trends
						const getDateKey = (timestamp: Date): string =>
							timestamp.toISOString().split("T")[0];

						const pvMap = new Map<string, number>();
						for (const e of pageViewEvents) {
							const key = getDateKey(e.timestamp);
							pvMap.set(key, (pvMap.get(key) || 0) + 1);
						}
						const pvTrends = Array.from(pvMap.entries())
							.map(([timestamp, value]) => ({ timestamp, value }))
							.sort((a, b) =>
								a.timestamp.localeCompare(b.timestamp)
							);

						const sdSumMap = new Map<string, number>();
						const sdCountMap = new Map<string, number>();
						for (const e of pageLeaveEvents) {
							const key = getDateKey(e.timestamp);
							sdSumMap.set(
								key,
								(sdSumMap.get(key) || 0) + (e.duration || 0)
							);
							sdCountMap.set(key, (sdCountMap.get(key) || 0) + 1);
						}
						const sdTrends = Array.from(sdSumMap.keys())
							.map((key) => ({
								timestamp: key,
								value:
									sdCountMap.get(key)! > 0
										? sdSumMap.get(key)! /
											sdCountMap.get(key)!
										: 0,
							}))
							.sort((a, b) =>
								a.timestamp.localeCompare(b.timestamp)
							);

						const errMap = new Map<string, number>();
						for (const e of errorEvents) {
							const key = getDateKey(e.timestamp);
							errMap.set(key, (errMap.get(key) || 0) + 1);
						}
						const errTrends = Array.from(errMap.entries())
							.map(([timestamp, value]) => ({ timestamp, value }))
							.sort((a, b) =>
								a.timestamp.localeCompare(b.timestamp)
							);

						// Update state
						set({
							userMetrics: {
								pageViews,
								avgSessionDuration,
								uniqueVisitors,
							},
							errorMetrics: { errorCount, errorRate },
							geoMetrics: geoData,
							pageViewTrends: pvTrends,
							sessionDurationTrends: sdTrends,
							errorTrends: errTrends,
							isLoading: false,
						});
					} catch (error) {
						console.error(
							"[AnalyticsStore] Failed to fetch analytics data:",
							error
						);
						set({
							error: "Failed to load analytics data",
							isLoading: false,
						});
					}
				},
			})),
			{
				name: "analytics-storage", // Persist to localStorage
				partialize: (state) => ({
					// Persist only non-transient state
					userMetrics: state.userMetrics,
					errorMetrics: state.errorMetrics,
					geoMetrics: state.geoMetrics,
					pageViewTrends: state.pageViewTrends,
					sessionDurationTrends: state.sessionDurationTrends,
					errorTrends: state.errorTrends,
					timeRange: state.timeRange,
				}),
			}
		)
	);
};
