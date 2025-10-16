import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import axios from "axios";
import axiosRetry from "axios-retry";
import { Task } from "@prisma/client";

interface TaskCounts {
	github: number;
	jira: number;
	linear: number;
	asana: number;
	total: number;
}

interface ProjectCounts {
	[projectId: string]: number;
}

export interface TaskState {
	tasks: Task[];
	filteredTasks: Task[];
	taskCounts: TaskCounts;
	selectedSource: string;
	selectedProject: string | null;
	searchQuery: string;
	statusFilter: string;
	assigneeFilter: string;
	priorityFilter: string;
	currentPage: number;
	itemsPerPage: number;
	loading: boolean;
	error: string | null;
	isInitialized: boolean;
	uniqueProjects: string[];
	uniqueAssignees: string[];
	projectCounts: ProjectCounts;
	totalPages: number;
	fetchTasks: () => Promise<void>;
	setSelectedSource: (source: string) => void;
	setSelectedProject: (projectId: string | null) => void;
	setSearchQuery: (query: string) => void;
	setStatusFilter: (status: string) => void;
	setAssigneeFilter: (assigneeId: string) => void;
	setPriorityFilter: (priority: string) => void;
	clearFilters: () => void;
	setCurrentPage: (page: number) => void;
	setInitialized: () => void;
	applyFilters: () => void;
}

// Configure axios with retries
axiosRetry(axios, {
	retries: 3,
	retryDelay: (retryCount: number) => retryCount * 1000,
});

export const createTaskStore = () =>
	create<TaskState>()(
		persist(
			immer((set, get) => ({
				tasks: [],
				filteredTasks: [],
				taskCounts: {
					github: 0,
					jira: 0,
					linear: 0,
					asana: 0,
					total: 0,
				},
				selectedSource: "all",
				selectedProject: null,
				searchQuery: "",
				statusFilter: "all",
				assigneeFilter: "all",
				priorityFilter: "all",
				currentPage: 1,
				itemsPerPage: 10,
				loading: false,
				error: null,
				isInitialized: false,
				uniqueProjects: [],
				uniqueAssignees: [],
				projectCounts: {},
				totalPages: 0,

				setInitialized: () =>
					set((state) => {
						state.isInitialized = true;
					}),

				fetchTasks: async () => {
					set((state) => {
						state.loading = true;
						state.error = null;
					});

					try {
						const response = await axios.get("/api/tasks");
						if (
							!response.data ||
							!Array.isArray(response.data.tasks) ||
							!response.data.counts
						) {
							throw new Error("Invalid tasks data format");
						}
						const { tasks, counts } = response.data;

						const projectCounts: ProjectCounts = tasks.reduce(
							(acc: ProjectCounts, t: Task) => {
								if (t.projectId)
									acc[t.projectId] =
										(acc[t.projectId] || 0) + 1;
								return acc;
							},
							{}
						);
						const uniqueProjects =
							Object.keys(projectCounts).sort();
						const uniqueAssignees = Array.from(
							new Set(
								tasks
									.map((t: Task) => t.assigneeId)
									.filter(Boolean)
							)
						).sort() as string[];

						set((state) => {
							state.tasks = tasks;
							state.filteredTasks = tasks;
							state.taskCounts = counts;
							state.uniqueProjects = uniqueProjects;
							state.uniqueAssignees = uniqueAssignees;
							state.projectCounts = projectCounts;
							state.totalPages = Math.ceil(
								tasks.length / state.itemsPerPage
							);
							state.loading = false;
							state.isInitialized = true;
						});
					} catch (error) {
						const errorMessage = `Failed to fetch tasks: ${(error as Error).message}`;
						set((state) => {
							state.error = errorMessage;
							state.loading = false;
						});
					}
				},

				setSelectedSource: (source: string) => {
					set((state) => {
						state.selectedSource = source.toLowerCase();
						state.currentPage = 1;
						get().applyFilters();
					});
				},

				setSelectedProject: (projectId: string | null) => {
					set((state) => {
						state.selectedProject = projectId;
						state.currentPage = 1;
						get().applyFilters();
					});
				},

				setSearchQuery: (query: string) => {
					set((state) => {
						state.searchQuery = query;
						state.currentPage = 1;
						get().applyFilters();
					});
				},

				setStatusFilter: (status: string) => {
					set((state) => {
						state.statusFilter = status;
						state.currentPage = 1;
						get().applyFilters();
					});
				},

				setAssigneeFilter: (assigneeId: string) => {
					set((state) => {
						state.assigneeFilter = assigneeId;
						state.currentPage = 1;
						get().applyFilters();
					});
				},

				setPriorityFilter: (priority: string) => {
					set((state) => {
						state.priorityFilter = priority;
						state.currentPage = 1;
						get().applyFilters();
					});
				},

				clearFilters: () => {
					set((state) => {
						state.searchQuery = "";
						state.statusFilter = "all";
						state.selectedSource = "all";
						state.assigneeFilter = "all";
						state.priorityFilter = "all";
						state.selectedProject = null;
						state.currentPage = 1;
						state.filteredTasks = state.tasks;
						state.totalPages = Math.ceil(
							state.tasks.length / state.itemsPerPage
						);
						const projectCounts: ProjectCounts = state.tasks.reduce(
							(acc: ProjectCounts, t: Task) => {
								if (t.projectId)
									acc[t.projectId] =
										(acc[t.projectId] || 0) + 1;
								return acc;
							},
							{}
						);
						state.uniqueProjects =
							Object.keys(projectCounts).sort();
						state.projectCounts = projectCounts;
					});
				},

				applyFilters: () => {
					set((state) => {
						let temp = state.tasks;

						if (state.searchQuery) {
							const query = state.searchQuery.toLowerCase();
							temp = temp.filter(
								(t) =>
									t.title.toLowerCase().includes(query) ||
									(t.description &&
										t.description
											.toLowerCase()
											.includes(query))
							);
						}
						if (state.statusFilter !== "all") {
							temp = temp.filter(
								(t) => t.status === state.statusFilter
							);
						}
						if (state.selectedSource !== "all") {
							temp = temp.filter(
								(t) =>
									t.sourceTool?.toLowerCase() ===
									state.selectedSource
							);
						}
						if (state.assigneeFilter !== "all") {
							temp = temp.filter(
								(t) => t.assigneeId === state.assigneeFilter
							);
						}
						if (state.priorityFilter !== "all") {
							temp = temp.filter(
								(t) => t.priority === state.priorityFilter
							);
						}
						if (state.selectedProject) {
							temp = temp.filter(
								(t) => t.projectId === state.selectedProject
							);
						}

						state.filteredTasks = temp;
						state.totalPages = Math.ceil(
							temp.length / state.itemsPerPage
						);

						const baseTasks =
							state.selectedSource === "all" ? state.tasks : temp;
						const projectCounts: ProjectCounts = baseTasks.reduce(
							(acc: ProjectCounts, t: Task) => {
								if (t.projectId)
									acc[t.projectId] =
										(acc[t.projectId] || 0) + 1;
								return acc;
							},
							{}
						);
						state.uniqueProjects =
							Object.keys(projectCounts).sort();
						state.projectCounts = projectCounts;
					});
				},

				setCurrentPage: (page: number) => {
					set((state) => {
						if (page >= 1 && page <= state.totalPages) {
							state.currentPage = page;
						}
					});
				},
			})),
			{
				name: "task-store",
				partialize: (state) => ({
					tasks: state.tasks,
					taskCounts: state.taskCounts,
					selectedSource: state.selectedSource,
					selectedProject: state.selectedProject,
					isInitialized: state.isInitialized,
				}),
			}
		)
	);
