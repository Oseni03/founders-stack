import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
	Repository,
	Branch,
	Contributor,
	Commit,
	PullRequest,
	Issue,
} from "@prisma/client";
import { persist } from "zustand/middleware";

interface ContributorType extends Contributor {
	attributes: {
		avatarUrl?: string;
		additions?: number;
		deletions?: number;
	};
}

interface CommitType extends Commit {
	attributes: {
		avatarUrl?: string;
		branch?: string;
		url?: string;
	};
}

export interface CodeState {
	repositories: Repository[];
	branches: Branch[];
	contributors: ContributorType[];
	commits: CommitType[];
	pullRequests: PullRequest[];
	issues: Issue[];
	loading: { [key: string]: boolean };
	error: { [key: string]: string | null };
	fetchRepositories: () => Promise<void>;
	fetchBranches: (repoId: string) => Promise<void>;
	fetchContributors: (repoId: string) => Promise<void>;
	fetchCommits: (repoId: string) => Promise<void>;
	fetchPullRequests: (repoId: string) => Promise<void>;
	fetchIssues: (repoId: string) => Promise<void>;
}

export const createCodeStore = () => {
	return create<CodeState>()(
		persist(
			immer((set) => ({
				repositories: [],
				branches: [],
				contributors: [],
				commits: [],
				pullRequests: [],
				issues: [],
				loading: {},
				error: {},
				fetchRepositories: async () => {
					set((state) => {
						state.loading.repositories = true;
						state.error.repositories = null;
					});
					try {
						const response = await fetch(`/api/code/repositories`);
						if (!response.ok)
							throw new Error("Failed to fetch repositories");
						const { data } = await response.json();
						set((state) => {
							state.repositories = data;
							state.loading.repositories = false;
						});
					} catch (error) {
						set((state) => {
							state.loading.repositories = false;
							state.error.repositories = (error as Error).message;
						});
					}
				},
				fetchBranches: async (repoId: string) => {
					set((state) => {
						state.loading.branches = true;
						state.error.branches = null;
					});
					try {
						const response = await fetch(
							`/api/code/repositories/${repoId}/branches`
						);
						if (!response.ok)
							throw new Error("Failed to fetch branches");
						const { data } = await response.json();
						set((state) => {
							state.branches = data;
							state.loading.branches = false;
						});
					} catch (error) {
						set((state) => {
							state.loading.branches = false;
							state.error.branches = (error as Error).message;
						});
					}
				},
				fetchCommits: async (repoId: string) => {
					set((state) => {
						state.loading.commits = true;
						state.error.commits = null;
					});
					try {
						const response = await fetch(
							`/api/code/repositories/${repoId}/commits`
						);
						if (!response.ok)
							throw new Error("Failed to fetch commits");
						const { data } = await response.json();
						set((state) => {
							state.commits = data;
							state.loading.commits = false;
						});
					} catch (error) {
						set((state) => {
							state.loading.commits = false;
							state.error.commits = (error as Error).message;
						});
					}
				},
				fetchContributors: async (repoId: string) => {
					set((state) => {
						state.loading.contributors = true;
						state.error.contributors = null;
					});
					try {
						const response = await fetch(
							`/api/code/repositories/${repoId}/contributors`
						);
						if (!response.ok)
							throw new Error("Failed to fetch contributors");
						const { data } = await response.json();
						set((state) => {
							state.contributors = data;
							state.loading.contributors = false;
						});
					} catch (error) {
						set((state) => {
							state.loading.contributors = false;
							state.error.contributors = (error as Error).message;
						});
					}
				},
				fetchIssues: async (repoId: string) => {
					set((state) => {
						state.loading.issues = true;
						state.error.issues = null;
					});
					try {
						const response = await fetch(
							`/api/code/repositories/${repoId}/issues`
						); // Note: API route not yet created
						if (!response.ok)
							throw new Error("Failed to fetch issues");
						const { data } = await response.json();
						set((state) => {
							state.issues = data;
							state.loading.issues = false;
						});
					} catch (error) {
						set((state) => {
							state.loading.issues = false;
							state.error.issues = (error as Error).message;
						});
					}
				},
				fetchPullRequests: async (repoId: string) => {
					set((state) => {
						state.loading.issues = true;
						state.error.issues = null;
					});
					try {
						const response = await fetch(
							`/api/code/repositories/${repoId}/pull-requests`
						);
						if (!response.ok)
							throw new Error("Failed to fetch pull requests");
						const { data } = await response.json();
						set((state) => {
							state.pullRequests = data;
							state.loading.pullRequests = false;
						});
					} catch (error) {
						set((state) => {
							state.loading.pullRequests = false;
							state.error.pullRequests = (error as Error).message;
						});
					}
				},
			})),
			{ name: "code-store" }
		)
	);
};
