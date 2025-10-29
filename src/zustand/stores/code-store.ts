import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Repository, CodeCIMetrics } from "@/types/code";

export interface CodeState {
	repositories: Repository[];
	selectedRepositoryId: string | null;
	data: CodeCIMetrics | null;
	loading: boolean;
	error: string | null;
	hasHydrated: boolean;

	// Actions
	setRepositories: (repos: Repository[]) => void;
	setSelectedRepository: (id: string) => void;
	addRepository: (repo: Repository) => void;
	deleteRepository: (id: string) => void;
	setData: (data: CodeCIMetrics | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setHasHydrated: (hasHydrated: boolean) => void;
}

/**
 * Factory function to create the Code store
 * Used with <CodeStoreProvider> for SSR-safe hydration
 */
export const createCodeStore = () => {
	return create<CodeState>()(
		persist(
			immer((set, get) => ({
				repositories: [],
				selectedRepositoryId: null,
				data: null,
				loading: false,
				error: null,
				hasHydrated: false,

				setRepositories: (repos) =>
					set((state) => {
						state.repositories = repos;
						// If we have a persisted selectedRepositoryId, validate it still exists
						if (state.selectedRepositoryId) {
							const exists = repos.some(
								(r) => r.id === state.selectedRepositoryId
							);
							if (!exists && repos.length > 0) {
								// If the persisted repo doesn't exist anymore, clear it
								state.selectedRepositoryId = null;
							}
						}
					}),

				setSelectedRepository: (id) =>
					set((state) => {
						console.log(
							"Store: setSelectedRepository called with:",
							id
						);
						state.selectedRepositoryId = id;
						// Clear data when switching repositories
						state.data = null;
						state.error = null;
					}),

				addRepository: (repo) =>
					set((state) => {
						state.repositories.push(repo);
					}),

				deleteRepository: (id) =>
					set((state) => {
						state.repositories = state.repositories.filter(
							(r) => r.id !== id
						);
						if (state.selectedRepositoryId === id) {
							state.selectedRepositoryId =
								state.repositories.length > 0
									? state.repositories[0].id
									: null;
							state.data = null;
						}
					}),

				setData: (data) =>
					set((state) => {
						console.log(
							"Store: setData called with:",
							data ? "data object" : "null"
						);
						state.data = data;
					}),

				setLoading: (loading) =>
					set((state) => {
						console.log("Store: setLoading called with:", loading);
						state.loading = loading;
					}),

				setError: (error) =>
					set((state) => {
						console.log("Store: setError called with:", error);
						state.error = error;
					}),

				setHasHydrated: (hasHydrated) =>
					set((state) => {
						state.hasHydrated = hasHydrated;
					}),
			})),
			{
				name: "code-store",
				storage: createJSONStorage(() => localStorage),
				partialize: (state) => ({
					selectedRepositoryId: state.selectedRepositoryId,
				}),
				onRehydrateStorage: () => (state) => {
					console.log("Store: Rehydration complete", state);
					if (state) {
						state.hasHydrated = true;
					}
				},
			}
		)
	);
};
