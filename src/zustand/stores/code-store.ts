// lib/stores/useCodeStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Repository, CodeCIMetrics } from "@/types/code";

export interface CodeState {
	repositories: Repository[];
	selectedRepositoryId: string | null;
	data: CodeCIMetrics | null;
	loading: boolean;
	error: string | null;

	// Actions
	setRepositories: (repos: Repository[]) => void;
	setSelectedRepository: (id: string) => void;
	addRepository: (repo: Repository) => void;
	deleteRepository: (id: string) => void;
	setData: (data: CodeCIMetrics | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	fetchData: (repositoryId: string) => Promise<void>;
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

				setRepositories: (repos) =>
					set((state) => {
						state.repositories = repos;
					}),

				setSelectedRepository: (id) =>
					set((state) => {
						state.selectedRepositoryId = id;
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
						if (
							state.selectedRepositoryId === id &&
							state.repositories.length > 0
						) {
							state.selectedRepositoryId =
								state.repositories[0].id;
						}
					}),

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

				fetchData: async (repositoryId: string) => {
					const { setLoading, setData, setError } = get();
					setLoading(true);
					setError(null);
					try {
						const res = await fetch(
							`/api/code-ci?repositoryId=${repositoryId}`
						);
						if (!res.ok) {
							const err = await res.text();
							throw new Error(err || "Failed to fetch");
						}
						const data: CodeCIMetrics = await res.json();
						setData(data);
					} catch (err: any) {
						setError(err.message);
					} finally {
						setLoading(false);
					}
				},
			})),
			{
				name: "code-store",
				partialize: (state) => ({
					selectedRepositoryId: state.selectedRepositoryId,
				}),
			}
		)
	);
};
