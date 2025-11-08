import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Metrics } from "@/lib/schemas";

export interface DashboardState {
	data: Metrics | null;
	loading: boolean;
	error: string | null;
	range: "7d" | "30d" | "90d";
	searchQuery: string;

	setData: (data: Metrics | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setRange: (range: "7d" | "30d" | "90d") => void;
	setSearchQuery: (query: string) => void;
	fetchData: (productId: string) => Promise<void>;
}

export const createDashboardStore = () => {
	return create<DashboardState>()(
		persist(
			immer((set, get) => ({
				data: null,
				loading: false,
				error: null,
				range: "7d",
				searchQuery: "",

				setData: (data) =>
					set((state) => {
						state.data = data;
					}),

				setLoading: (loading) =>
					set((state) => {
						state.loading = loading;
					}),

				setError: (error) =>
					set((state) => {
						state.error = error;
					}),

				setRange: (range) =>
					set((state) => {
						state.range = range;
					}),

				setSearchQuery: (query) =>
					set((state) => {
						state.searchQuery = query;
					}),

				fetchData: async (productId) => {
					const {
						range,
						searchQuery,
						setLoading,
						setData,
						setError,
					} = get();
					setLoading(true);
					setError(null);
					try {
						const params = new URLSearchParams({ range });
						if (searchQuery) params.append("q", searchQuery);
						const res = await fetch(
							`/api/products/${productId}/metrics?${params}`
						);
						if (!res.ok) throw new Error(await res.text());
						const data: Metrics = await res.json();
						setData(data);
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					} catch (err: any) {
						setError(err.message);
					} finally {
						setLoading(false);
					}
				},
			})),
			{
				name: "dashboard-store",
				partialize: (state) => ({ range: state.range }),
			}
		)
	);
};
