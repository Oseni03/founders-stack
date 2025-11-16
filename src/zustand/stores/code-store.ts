import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Build, Commit, PullRequest, Repository } from "@prisma/client";

export interface CodeState {
	repositories: Repository[];
	setRepositories: (repositories: Repository[]) => void;
	pullRequests: PullRequest[];
	setPullRequests: (pullRequests: PullRequest[]) => void;
	commits: Commit[];
	setCommits: (commits: Commit[]) => void;
	builds: Build[];
	setBuilds: (builds: Build[]) => void;
	prFilters: {
		status: string;
		author: string;
		reviewer: string;
		repository: string[];
		label: string;
	};
	setPrFilters: (filters: Partial<CodeState["prFilters"]>) => void;
	selectedPullRequest: PullRequest | null;
	setSelectedPullRequest: (pr: PullRequest | null) => void;
	// Similar filters for other tabs can be added as needed
}

export const createCodeStore = () => {
	return create<CodeState>()(
		persist(
			immer((set) => ({
				repositories: [],
				pullRequests: [],
				commits: [],
				builds: [],
				prFilters: {
					status: "Open",
					author: "All",
					reviewer: "All",
					repository: [],
					label: "",
				},
				selectedPullRequest: null,
				setRepositories: (repositories) => set({ repositories }),
				setPullRequests: (pullRequests) => set({ pullRequests }),
				setCommits: (commits) => set({ commits }),
				setBuilds: (builds) => set({ builds }),
				setPrFilters: (newFilters) =>
					set((state) => ({
						prFilters: { ...state.prFilters, ...newFilters },
					})),
				setSelectedPullRequest: (selectedPullRequest) =>
					set({ selectedPullRequest }),
			})),
			{ name: "code-store" }
		)
	);
};
