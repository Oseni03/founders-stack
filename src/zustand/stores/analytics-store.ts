import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface EventType {
	name: string;
	count: number;
	percentage: number;
}

interface DeviceType {
	name: string;
	count: number;
	percentage: number;
}

interface TopPage {
	pathname: string;
	pageviews: number;
	avgDuration: number;
}

interface TopReferrer {
	referringDomain: string;
	count: number;
	percentage: number;
}

interface GeoMetric {
	geoipCountryName: string;
	geoipCountryCode: string;
	count: number;
	percentage: number;
}

interface BrowserLanguage {
	browserLanguagePrefix: string;
	count: number;
	percentage: number;
}

interface EventTrend {
	timestamp: string;
	pageviews: number;
	events: number;
}

interface AnalyticsData {
	timeRange: string;
	summary: {
		totalEvents: number;
		totalPageviews: number;
		uniqueVisitors: number;
		avgSessionDuration: number;
	};
	eventTypes: EventType[];
	deviceTypes: DeviceType[];
	topPages: TopPage[];
	topReferrers: TopReferrer[];
	geoMetrics: GeoMetric[];
	browserLanguages: BrowserLanguage[];
	eventTrends: EventTrend[];
	insight: string;
}

export interface AnalyticsState {
	data: AnalyticsData | null;
	loading: boolean;
	timeRange: string;
	error: string | null;

	setData: (data: AnalyticsData) => void;
	setLoading: (loading: boolean) => void;
	setTimeRange: (range: string) => void;
	setError: (error: string | null) => void;
	clearError: () => void;

	updateSummary: (summary: Partial<AnalyticsData["summary"]>) => void;
	addEventType: (eventType: EventType) => void;
	updateEventTrends: (trends: EventTrend[]) => void;

	reset: () => void;
}

const initialState = {
	data: null,
	loading: true,
	timeRange: "30d",
	error: null,
};

export const createAnalyticsStore = () => {
	return create<AnalyticsState>()(
		persist(
			immer((set) => ({
				...initialState,

				setData: (data) => {
					set((state) => {
						state.data = data;
						state.loading = false;
						state.error = null;
					});
				},

				setLoading: (loading) => {
					set((state) => {
						state.loading = loading;
					});
				},

				setTimeRange: (range) => {
					set((state) => {
						state.timeRange = range;
					});
				},

				setError: (error) => {
					set((state) => {
						state.error = error;
					});
				},

				clearError: () => {
					set((state) => {
						state.error = null;
					});
				},

				updateSummary: (summary) => {
					set((state) => {
						if (state.data) {
							state.data.summary = {
								...state.data.summary,
								...summary,
							};
						}
					});
				},

				addEventType: (eventType) => {
					set((state) => {
						if (state.data) {
							const existingIndex =
								state.data.eventTypes.findIndex(
									(et) => et.name === eventType.name
								);

							if (existingIndex !== -1) {
								state.data.eventTypes[existingIndex] =
									eventType;
							} else {
								state.data.eventTypes.push(eventType);
							}

							// Recalculate percentages
							const total = state.data.eventTypes.reduce(
								(sum, et) => sum + et.count,
								0
							);
							state.data.eventTypes.forEach((et) => {
								et.percentage = parseFloat(
									((et.count / total) * 100).toFixed(1)
								);
							});
						}
					});
				},

				updateEventTrends: (trends) => {
					set((state) => {
						if (state.data) {
							state.data.eventTrends = trends;
						}
					});
				},

				reset: () => {
					set(initialState);
				},
			})),
			{
				name: "analytics-store",
				partialize: (state) => ({
					timeRange: state.timeRange,
				}),
			}
		)
	);
};
