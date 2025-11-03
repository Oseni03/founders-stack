import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

export interface ProjectMetrics {
	openTasks: number;
	velocity: number[];
	overdueTasks: number;
	tasks: {
		id: string;
		title: string;
		priority: "low" | "medium" | "high" | "urgent";
		dueDate: string;
		status: string;
	}[];

	insight: string;
}

export interface ProjectState {
	data: ProjectMetrics | null;
	loading: boolean;
	error: string | null;
	range: "7d" | "30d" | "90d";

	setData: (data: ProjectMetrics | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setRange: (range: "7d" | "30d" | "90d") => void;
	fetchData: (range: "7d" | "30d" | "90d") => Promise<void>;
}

export const createProjectStore = () => {
	return create<ProjectState>()(
		persist(
			immer((set, get) => ({
				data: null,
				loading: false,
				error: null,
				range: "30d",

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

				fetchData: async (range) => {
					const { setLoading, setData, setError, setRange } = get();
					setLoading(true);
					setError(null);
					setRange(range);
					try {
						const res = await fetch(
							`/api/project-health?range=${range}`
						);
						if (!res.ok) throw new Error(await res.text());
						const data: ProjectMetrics = await res.json();
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
				name: "project-store",
				partialize: (state) => ({ range: state.range }),
			}
		)
	);
};
