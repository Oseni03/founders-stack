import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Repository } from "@/types/code";

export interface CodeState {
	repositories: Repository[];
	selectedRepositoryId: string | null;
	error: string | null;

	setRepositories: (repos: Repository[]) => void;
	setSelectedRepository: (id: string) => void;
	addRepository: (repo: Repository) => void;
	removeRepository: (id: string) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
}

export const createCodeStore = () => {
	return create<CodeState>()(
		persist(
			immer((set) => ({
				repositories: [],
				selectedRepositoryId: null,
				error: null,

				setRepositories: (repos) =>
					set((state) => {
						state.repositories = repos;
						state.error = null;
						// If persisted repo doesn't exist anymore, clear it
						if (state.selectedRepositoryId) {
							const exists = repos.some(
								(r) => r.id === state.selectedRepositoryId
							);
							if (!exists) {
								state.selectedRepositoryId = null;
							}
						}
					}),

				setSelectedRepository: (id) =>
					set((state) => {
						state.selectedRepositoryId = id;
					}),

				addRepository: (repo) =>
					set((state) => {
						state.repositories.push(repo);
						state.error = null;
					}),

				removeRepository: (id) =>
					set((state) => {
						state.repositories = state.repositories.filter(
							(r) => r.id !== id
						);
						// If deleted repo was selected, clear selection
						if (state.selectedRepositoryId === id) {
							state.selectedRepositoryId =
								state.repositories.length > 0
									? state.repositories[0].id
									: null;
						}
						state.error = null;
					}),

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
			})),
			{
				name: "code-store",
				storage: createJSONStorage(() => localStorage),
				partialize: (state) => ({
					selectedRepositoryId: state.selectedRepositoryId,
				}),
			}
		)
	);
};
