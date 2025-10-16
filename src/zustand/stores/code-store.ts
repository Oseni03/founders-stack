/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import axios from "axios";
import axiosRetry from "axios-retry";
import { Repository, Branch, PullRequest, Issue } from "@prisma/client";
import {
	CommitType,
	ContributorType,
	PRStatus,
	RepoHealth,
} from "@/types/code";

// Configure axios with retries
axiosRetry(axios, {
	retries: 3,
	retryDelay: (retryCount: number) => retryCount * 1000,
});

export interface CodeState {
	repoHealth: RepoHealth | null;
	prStatus: PRStatus | null;
	activeRepoId: string;
	repositories: Repository[];
	branches: Branch[];
	contributors: ContributorType[];
	commits: CommitType[];
	pullRequests: PullRequest[];
	issues: Issue[];
	loading: { [key: string]: boolean };
	error: string | null;
	cache: Map<string, any>;
	fetchData: (repoId: string) => Promise<void>;
	fetchRepositories: () => Promise<void>;
	fetchBranches: (repoId: string) => Promise<void>;
	fetchCommits: (repoId: string) => Promise<void>;
	fetchContributors: (repoId: string) => Promise<void>;
	fetchPullRequests: (repoId: string) => Promise<void>;
	fetchIssues: (repoId: string) => Promise<void>;
	deleteRepository: (repoId: string) => Promise<void>;
	computePRStatus: (repoId: string) => void;
	computeRepoHealth: (repoId: string) => void;
	setActiveRepoId: (repoId: string) => void;
}

export const createCodeStore = () => {
	return create<CodeState>()(
		persist(
			immer((set, get) => ({
				repoHealth: null,
				prStatus: null,
				activeRepoId: "",
				repositories: [],
				branches: [],
				contributors: [],
				commits: [],
				pullRequests: [],
				issues: [],
				loading: {},
				error: null,
				cache: new Map(),

				fetchData: async (repoId: string) => {
					set((state) => {
						state.loading.global = true;
						state.error = null;
					});
					try {
						// ✅ Call methods outside of set()
						await Promise.all([
							get().fetchBranches(repoId),
							get().fetchCommits(repoId),
							get().fetchContributors(repoId),
							get().fetchIssues(repoId),
							get().fetchPullRequests(repoId),
						]);
						get().computePRStatus(repoId);
						get().computeRepoHealth(repoId);
					} catch (error) {
						set((state) => {
							state.error = (error as Error).message;
							state.loading.global = false;
						});
						console.error(
							"[CodeStore] Error fetching data:",
							error
						);
					}
				},

				fetchRepositories: async () => {
					const cacheKey = "repositories";

					// ✅ Get state BEFORE set() call
					const currentState = get();
					const cachedData = currentState.cache.get(cacheKey);

					if (cachedData) {
						set((state) => {
							state.repositories = cachedData;
							state.loading.repositories = false;
							state.error = null;
						});
						return;
					}

					set((state) => {
						state.loading.repositories = true;
						state.error = null;
					});

					try {
						const response = await axios.get(`/api/repositories`);
						const { data } = response.data;

						set((state) => {
							state.repositories = data;
							state.loading.repositories = false;
							state.cache.set(cacheKey, data);
						});
					} catch (error) {
						set((state) => {
							state.error = (error as Error).message;
							state.loading.repositories = false;
						});
						console.error(
							"[CodeStore] Failed to fetch repositories:",
							error
						);
					}
				},

				fetchBranches: async (repoId: string) => {
					const cacheKey = `branches:${repoId}`;

					// ✅ Get cache data BEFORE set() call
					const currentState = get();
					const cachedData = currentState.cache.get(cacheKey);

					if (cachedData) {
						set((state) => {
							state.branches = cachedData;
							state.loading.branches = false;
						});
						return;
					}

					set((state) => {
						state.loading.branches = true;
						state.error = null;
					});

					try {
						const response = await axios.get(
							`/api/repositories/${repoId}/branches`
						);
						const { data } = response.data;
						set((state) => {
							state.branches = data;
							state.loading.branches = false;
							state.cache.set(cacheKey, data);
						});
					} catch (error) {
						set((state) => {
							state.error = (error as Error).message;
							state.loading.branches = false;
						});
						console.error(
							"[CodeStore] Failed to fetch branches:",
							error
						);
					}
				},

				fetchCommits: async (repoId: string) => {
					const cacheKey = `commits:${repoId}`;

					// ✅ Get cache data BEFORE set() call
					const currentState = get();
					const cachedData = currentState.cache.get(cacheKey);

					if (cachedData) {
						set((state) => {
							state.commits = cachedData;
							state.loading.commits = false;
						});
						return;
					}

					set((state) => {
						state.loading.commits = true;
						state.error = null;
					});

					try {
						const response = await axios.get(
							`/api/repositories/${repoId}/commits`
						);
						const { data } = response.data;
						set((state) => {
							state.commits = data;
							state.loading.commits = false;
							state.cache.set(cacheKey, data);
						});
					} catch (error) {
						set((state) => {
							state.error = (error as Error).message;
							state.loading.commits = false;
						});
						console.error(
							"[CodeStore] Failed to fetch commits:",
							error
						);
					}
				},

				fetchContributors: async (repoId: string) => {
					const cacheKey = `contributors:${repoId}`;

					// ✅ Get cache data BEFORE set() call
					const currentState = get();
					const cachedData = currentState.cache.get(cacheKey);

					if (cachedData) {
						set((state) => {
							state.contributors = cachedData;
							state.loading.contributors = false;
						});
						return;
					}

					set((state) => {
						state.loading.contributors = true;
						state.error = null;
					});

					try {
						const response = await axios.get(
							`/api/repositories/${repoId}/contributors`
						);
						const { data } = response.data;
						set((state) => {
							state.contributors = data;
							state.loading.contributors = false;
							state.cache.set(cacheKey, data);
						});
					} catch (error) {
						set((state) => {
							state.error = (error as Error).message;
							state.loading.contributors = false;
						});
						console.error(
							"[CodeStore] Failed to fetch contributors:",
							error
						);
					}
				},

				fetchPullRequests: async (repoId: string) => {
					const cacheKey = `pullRequests:${repoId}`;

					// ✅ Get cache data BEFORE set() call
					const currentState = get();
					const cachedData = currentState.cache.get(cacheKey);

					if (cachedData) {
						set((state) => {
							state.pullRequests = cachedData;
							state.loading.pullRequests = false;
						});
						return;
					}

					set((state) => {
						state.loading.pullRequests = true;
						state.error = null;
					});

					try {
						const response = await axios.get(
							`/api/repositories/${repoId}/pull-requests`
						);
						const { data } = response.data;
						set((state) => {
							state.pullRequests = data;
							state.loading.pullRequests = false;
							state.cache.set(cacheKey, data);
						});
					} catch (error) {
						set((state) => {
							state.error = (error as Error).message;
							state.loading.pullRequests = false;
						});
						console.error(
							"[CodeStore] Failed to fetch pull requests:",
							error
						);
					}
				},

				fetchIssues: async (repoId: string) => {
					const cacheKey = `issues:${repoId}`;

					// ✅ Get cache data BEFORE set() call
					const currentState = get();
					const cachedData = currentState.cache.get(cacheKey);

					if (cachedData) {
						set((state) => {
							state.issues = cachedData;
							state.loading.issues = false;
						});
						return;
					}

					set((state) => {
						state.loading.issues = true;
						state.error = null;
					});

					try {
						const response = await axios.get(
							`/api/repositories/${repoId}/issues`
						);
						const { data } = response.data;
						set((state) => {
							state.issues = data;
							state.loading.issues = false;
							state.cache.set(cacheKey, data);
						});
					} catch (error) {
						set((state) => {
							state.error = (error as Error).message;
							state.loading.issues = false;
						});
						console.error(
							"[CodeStore] Failed to fetch issues:",
							error
						);
					}
				},

				deleteRepository: async (repoId: string) => {
					set((state) => {
						state.loading.deleteRepository = true;
						state.error = null;
					});
					try {
						await axios.delete(`/api/repositories/${repoId}`);
						set((state) => {
							state.repositories = state.repositories.filter(
								(repo) => repo.id !== repoId
							);
							if (state.activeRepoId === repoId) {
								state.activeRepoId =
									state.repositories[0]?.id || "";
							}
							state.commits = state.commits.filter(
								(c) => c.repositoryId !== repoId
							);
							state.pullRequests = state.pullRequests.filter(
								(pr) => pr.repositoryId !== repoId
							);
							state.issues = state.issues.filter(
								(issue) => issue.repositoryId !== repoId
							);
							state.branches = state.branches.filter(
								(branch) => branch.repositoryId !== repoId
							);
							state.contributors = state.contributors.filter(
								(contributor) =>
									contributor.repositoryId !== repoId
							);
							state.loading.deleteRepository = false;
							state.cache.delete(`branches:${repoId}`);
							state.cache.delete(`commits:${repoId}`);
							state.cache.delete(`contributors:${repoId}`);
							state.cache.delete(`pullRequests:${repoId}`);
							state.cache.delete(`issues:${repoId}`);
						});
					} catch (error) {
						set((state) => {
							state.error = (error as Error).message;
							state.loading.deleteRepository = false;
						});
						console.error(
							"[CodeStore] Failed to delete repository:",
							error
						);
					}
				},

				computePRStatus: (repoId: string) => {
					// ✅ Get state BEFORE set() call
					const currentState = get();
					const filteredPRs = currentState.pullRequests.filter(
						(pr) => pr.repositoryId === repoId
					);
					const open = filteredPRs.filter(
						(pr) => pr.status === "open"
					).length;
					const merged = filteredPRs.filter(
						(pr) => pr.status === "merged"
					).length;
					const draft = filteredPRs.filter(
						(pr) => pr.status === "draft"
					).length;

					set((state) => {
						state.prStatus = { open, merged, draft };
					});
				},

				computeRepoHealth: (repoId: string) => {
					// ✅ Get state BEFORE set() call
					const currentState = get();
					const filteredPRs = currentState.pullRequests.filter(
						(pr) => pr.repositoryId === repoId
					);
					const filteredIssues = currentState.issues.filter(
						(issue) => issue.repositoryId === repoId
					);
					const filteredStalePRs = filteredPRs.filter(
						(pr) =>
							pr.status === "open" &&
							Date.now() - new Date(pr.createdAt).getTime() >
								30 * 24 * 60 * 60 * 1000
					);
					const avgReviewTime =
						filteredPRs.reduce(
							(sum, pr) => sum + (pr.avgReviewTime || 0),
							0
						) / (filteredPRs.length || 1);
					const openIssues = filteredIssues.filter(
						(issue) => issue.status === "open"
					).length;
					const stalePRs = filteredStalePRs.length;
					const score = Math.max(
						0,
						100 -
							openIssues * 2 -
							stalePRs * 5 -
							(avgReviewTime > 24 ? 10 : 0)
					);

					set((state) => {
						state.repoHealth = {
							score: Math.round(score),
							openIssues,
							stalePRs,
							codeReviewTime: `${avgReviewTime.toFixed(1)} hours`,
							testCoverage: 0,
						};
					});
				},

				setActiveRepoId: (repoId: string) => {
					set((state) => {
						state.activeRepoId = repoId;
					});
					if (repoId) {
						// ✅ Call outside of set()
						get().fetchData(repoId);
					}
				},
			})),
			{
				name: "code-store",
				partialize: (state) => ({
					repositories: state.repositories,
					activeRepoId: state.activeRepoId,
					cache: Array.from(state.cache.entries()),
				}),
				onRehydrateStorage: () => (state) => {
					if (state?.cache) {
						state.cache = new Map(state.cache);
					}
				},
			}
		)
	);
};
