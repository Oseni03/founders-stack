import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { AnalyticsData } from "@prisma/client";

export interface AnalyticsState {
	metrics: AnalyticsData[];
	selectedMetric: AnalyticsData | null;
	filters: { timeRange: string; comparePeriod: boolean; segments: string[] };
	activeTab: string;
	anomalies: Array<{
		id: string;
		title: string;
		description: string;
		detectedAt: Date;
	}>;
	setMetrics: (metrics: AnalyticsData[]) => void;
	setSelectedMetric: (metric: AnalyticsData | null) => void;
	setFilters: (filters: Partial<AnalyticsState["filters"]>) => void;
	setActiveTab: (tab: string) => void;
	addAnomaly: (anomaly: AnalyticsState["anomalies"][0]) => void;
	acknowledgeAnomaly: (id: string) => void;
}

export const createAnalyticsStore = () => {
	return create<AnalyticsState>()(
		persist(
			immer((set) => ({
				metrics: [],
				selectedMetric: null,
				filters: {
					timeRange: "7d",
					comparePeriod: false,
					segments: [],
				},
				activeTab: "overview",
				anomalies: [],
				setMetrics: (metrics) => set({ metrics }),
				setSelectedMetric: (selectedMetric) => set({ selectedMetric }),
				setFilters: (newFilters) =>
					set((state) => ({
						filters: { ...state.filters, ...newFilters },
					})),
				setActiveTab: (activeTab) => set({ activeTab }),
				addAnomaly: (anomaly) =>
					set((state) => {
						state.anomalies.push(anomaly);
					}),
				acknowledgeAnomaly: (id) =>
					set((state) => ({
						anomalies: state.anomalies.filter((a) => a.id !== id),
					})),
			})),
			{ name: "analytics-store" }
		)
	);
};
