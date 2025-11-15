/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { logger } from "@/lib/logger";

export interface Task {
	id: string;
	externalId: string;
	title: string;
	description?: string;
	status: string;
	priority?: string;
	type?: string;
	assignee?: {
		id: string;
		name: string;
		email: string;
		avatar?: string;
	} | null;
	reporterId?: string;
	reporterName?: string;
	dueDate?: string;
	startDate?: string;
	completedAt?: string;
	estimatedHours?: number;
	actualHours?: number;
	storyPoints?: number;
	labels: string[];
	sprintId?: string;
	sprintName?: string;
	epicId?: string;
	epicName?: string;
	parentTaskId?: string;
	dependencies: string[];
	url?: string;
	metadata?: any;
	project: {
		id: string;
		name: string;
		platform?: string;
		status: string;
	};
	sourceTool: string;
	integrationId: string;
	commentsCount: number;
	linkedItemsCount: number;
	isWatching: boolean;
	createdAt: string;
	updatedAt: string;
	syncedAt: string;
}

export interface Project {
	id: string;
	name: string;
	description?: string;
	externalId?: string;
	platform?: string;
	attributes?: any;
	status: string;
	taskCount: number;
	openTasks: number;
	createdAt: string;
	updatedAt: string;
}

export interface Comment {
	id: string;
	content: string;
	author: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
	createdAt: string;
	updatedAt: string;
}

export interface TaskFilters {
	view: "my-tasks" | "team-tasks" | "all-projects" | "sprints";
	status: string;
	priority: string;
	assigneeId: string;
	projectId: string;
	integrationId: string;
	dateRange: "today" | "week" | "month" | "overdue" | "all";
	search: string;
}

export interface ProjectState {
	tasks: Task[];
	projects: Project[];
	selectedTask: Task | null;
	loading: boolean;
	error: string | null;
	filters: TaskFilters;
	viewMode: "list" | "board" | "calendar";

	// Setters
	setTasks: (tasks: Task[]) => void;
	setProjects: (projects: Project[]) => void;
	setSelectedTask: (task: Task | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setFilter: (key: keyof TaskFilters, value: any) => void;
	setViewMode: (mode: "list" | "board" | "calendar") => void;
	clearError: () => void;

	// API Actions
	fetchTasks: (orgId: string) => Promise<void>;
	fetchProjects: (orgId: string) => Promise<void>;
	fetchTaskDetails: (orgId: string, taskId: string) => Promise<void>;
	updateTask: (
		orgId: string,
		taskId: string,
		updates: Partial<Task>
	) => Promise<void>;
	deleteTask: (orgId: string, taskId: string) => Promise<void>;
	bulkUpdateTasks: (
		orgId: string,
		taskIds: string[],
		updates: any
	) => Promise<void>;
	addComment: (
		orgId: string,
		taskId: string,
		content: string
	) => Promise<void>;
	toggleWatcher: (
		orgId: string,
		taskId: string,
		isWatching: boolean
	) => Promise<void>;
}

export const createProjectStore = () => {
	return create<ProjectState>()(
		persist(
			immer((set, get) => ({
				tasks: [],
				projects: [],
				selectedTask: null,
				loading: false,
				error: null,
				filters: {
					view: "my-tasks",
					status: "all",
					priority: "all",
					assigneeId: "me",
					projectId: "",
					integrationId: "",
					dateRange: "all",
					search: "",
				},
				viewMode: "list",

				setTasks: (tasks) =>
					set((state) => {
						state.tasks = tasks;
					}),

				setProjects: (projects) =>
					set((state) => {
						state.projects = projects;
					}),

				setSelectedTask: (task) =>
					set((state) => {
						state.selectedTask = task;
					}),

				setLoading: (loading) =>
					set((state) => {
						state.loading = loading;
					}),

				setError: (error) =>
					set((state) => {
						state.error = error;
					}),

				setFilter: <K extends keyof TaskFilters>(
					key: K,
					value: TaskFilters[K]
				) =>
					set((state) => {
						state.filters[key] = value;
					}),

				setViewMode: (mode) =>
					set((state) => {
						state.viewMode = mode;
					}),

				clearError: () =>
					set((state) => {
						state.error = null;
					}),

				fetchTasks: async (orgId) => {
					const { setLoading, setError, setTasks, filters } = get();
					setLoading(true);
					setError(null);

					try {
						logger.info("Fetching tasks", { orgId, filters });

						// Build query params
						const params = new URLSearchParams();
						if (filters.status !== "all")
							params.append("status", filters.status);
						if (filters.priority !== "all")
							params.append("priority", filters.priority);
						if (filters.assigneeId)
							params.append("assigneeId", filters.assigneeId);
						if (filters.projectId)
							params.append("projectId", filters.projectId);
						if (filters.integrationId)
							params.append(
								"integrationId",
								filters.integrationId
							);
						if (filters.dateRange !== "all")
							params.append("dateRange", filters.dateRange);
						if (filters.view) params.append("view", filters.view);
						if (filters.search)
							params.append("search", filters.search);

						const res = await fetch(
							`/api/products/${orgId}/tasks?${params.toString()}`
						);

						if (!res.ok) {
							const errorText = await res.text();
							throw new Error(errorText);
						}

						const { tasks } = await res.json();
						logger.info("Tasks fetched successfully", {
							count: tasks.length,
						});

						setTasks(tasks);
					} catch (err: any) {
						logger.error("Error fetching tasks", {
							error: err,
							orgId,
						});
						setError(err.message || "Failed to fetch tasks");
					} finally {
						setLoading(false);
					}
				},

				fetchProjects: async (orgId) => {
					const { setLoading, setError, setProjects } = get();
					setLoading(true);
					setError(null);

					try {
						logger.info("Fetching projects", { orgId });

						const res = await fetch(
							`/api/products/${orgId}/projects?status=active`
						);

						if (!res.ok) {
							const errorText = await res.text();
							throw new Error(errorText);
						}

						const { projects } = await res.json();
						logger.info("Projects fetched successfully", {
							count: projects.length,
						});

						setProjects(projects);
					} catch (err: any) {
						logger.error("Error fetching projects", {
							error: err,
							orgId,
						});
						setError(err.message || "Failed to fetch projects");
					} finally {
						setLoading(false);
					}
				},

				fetchTaskDetails: async (orgId, taskId) => {
					const { setLoading, setError, setSelectedTask } = get();
					setLoading(true);
					setError(null);

					try {
						logger.info("Fetching task details", { orgId, taskId });

						const res = await fetch(
							`/api/products/${orgId}/tasks/${taskId}`
						);

						if (!res.ok) {
							const errorText = await res.text();
							throw new Error(errorText);
						}

						const { task } = await res.json();
						logger.info("Task details fetched successfully", {
							taskId,
						});

						setSelectedTask(task);
					} catch (err: any) {
						logger.error("Error fetching task details", {
							error: err,
							taskId,
						});
						setError(err.message || "Failed to fetch task details");
					} finally {
						setLoading(false);
					}
				},

				updateTask: async (orgId, taskId, updates) => {
					const {
						setLoading,
						setError,
						tasks,
						setTasks,
						selectedTask,
						setSelectedTask,
					} = get();
					setLoading(true);
					setError(null);

					try {
						logger.info("Updating task", {
							orgId,
							taskId,
							updates,
						});

						const res = await fetch(
							`/api/products/${orgId}/tasks/${taskId}`,
							{
								method: "PATCH",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify(updates),
							}
						);

						if (!res.ok) {
							const errorText = await res.text();
							throw new Error(errorText);
						}

						const { task } = await res.json();
						logger.info("Task updated successfully", { taskId });

						// Update in tasks list
						const updatedTasks = tasks.map((t) =>
							t.id === taskId ? { ...t, ...task } : t
						);
						setTasks(updatedTasks);

						// Update selected task if it's the same
						if (selectedTask?.id === taskId) {
							setSelectedTask({ ...selectedTask, ...task });
						}
					} catch (err: any) {
						logger.error("Error updating task", {
							error: err,
							taskId,
						});
						setError(err.message || "Failed to update task");
						throw err;
					} finally {
						setLoading(false);
					}
				},

				deleteTask: async (orgId, taskId) => {
					const {
						setLoading,
						setError,
						tasks,
						setTasks,
						setSelectedTask,
					} = get();
					setLoading(true);
					setError(null);

					try {
						logger.info("Deleting task", { orgId, taskId });

						const res = await fetch(
							`/api/products/${orgId}/tasks/${taskId}`,
							{
								method: "DELETE",
							}
						);

						if (!res.ok) {
							const errorText = await res.text();
							throw new Error(errorText);
						}

						logger.info("Task deleted successfully", { taskId });

						// Remove from tasks list
						const updatedTasks = tasks.filter(
							(t) => t.id !== taskId
						);
						setTasks(updatedTasks);

						// Clear selected task if it's the deleted one
						setSelectedTask(null);
					} catch (err: any) {
						logger.error("Error deleting task", {
							error: err,
							taskId,
						});
						setError(err.message || "Failed to delete task");
						throw err;
					} finally {
						setLoading(false);
					}
				},

				bulkUpdateTasks: async (orgId, taskIds, updates) => {
					const { setLoading, setError, tasks, setTasks } = get();
					setLoading(true);
					setError(null);

					try {
						logger.info("Bulk updating tasks", {
							orgId,
							taskIds,
							updates,
						});

						const res = await fetch(
							`/api/products/${orgId}/tasks/bulk`,
							{
								method: "PATCH",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ taskIds, updates }),
							}
						);

						if (!res.ok) {
							const errorText = await res.text();
							throw new Error(errorText);
						}

						const { tasks: updatedTasks } = await res.json();
						logger.info("Tasks bulk updated successfully", {
							count: updatedTasks.length,
						});

						// Update tasks in state
						const taskMap = new Map(
							updatedTasks.map((t: Task) => [t.id, t])
						);
						const newTasks = tasks.map((t) =>
							taskMap.has(t.id) ? taskMap.get(t.id)! : t
						) as Task[];
						setTasks(newTasks);
					} catch (err: any) {
						logger.error("Error bulk updating tasks", {
							error: err,
						});
						setError(err.message || "Failed to bulk update tasks");
						throw err;
					} finally {
						setLoading(false);
					}
				},

				addComment: async (orgId, taskId, content) => {
					const {
						setLoading,
						setError,
						selectedTask,
						setSelectedTask,
					} = get();
					setLoading(true);
					setError(null);

					try {
						logger.info("Adding comment", {
							orgId,
							taskId,
							content,
						});

						const res = await fetch(
							`/api/products/${orgId}/tasks/${taskId}/comments`,
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ content }),
							}
						);

						if (!res.ok) {
							const errorText = await res.text();
							throw new Error(errorText);
						}

						const { comment } = await res.json();
						logger.info("Comment added successfully", { taskId });

						// Update selected task with new comment
						if (selectedTask?.id === taskId) {
							setSelectedTask({
								...selectedTask,
								commentsCount: selectedTask.commentsCount + 1,
							});
						}

						// Re-fetch task details to get updated comments
						await get().fetchTaskDetails(orgId, taskId);
					} catch (err: any) {
						logger.error("Error adding comment", {
							error: err,
							taskId,
						});
						setError(err.message || "Failed to add comment");
						throw err;
					} finally {
						setLoading(false);
					}
				},

				toggleWatcher: async (orgId, taskId, isWatching) => {
					const {
						setLoading,
						setError,
						tasks,
						setTasks,
						selectedTask,
						setSelectedTask,
					} = get();
					setLoading(true);
					setError(null);

					try {
						logger.info("Toggling watcher", {
							orgId,
							taskId,
							isWatching,
						});

						const res = await fetch(
							`/api/products/${orgId}/tasks/${taskId}/watchers`,
							{
								method: isWatching ? "DELETE" : "POST",
							}
						);

						if (!res.ok) {
							const errorText = await res.text();
							throw new Error(errorText);
						}

						logger.info("Watcher toggled successfully", {
							taskId,
							isWatching: !isWatching,
						});

						// Update tasks list
						const updatedTasks = tasks.map((t) =>
							t.id === taskId
								? { ...t, isWatching: !isWatching }
								: t
						);
						setTasks(updatedTasks);

						// Update selected task
						if (selectedTask?.id === taskId) {
							setSelectedTask({
								...selectedTask,
								isWatching: !isWatching,
							});
						}
					} catch (err: any) {
						logger.error("Error toggling watcher", {
							error: err,
							taskId,
						});
						setError(err.message || "Failed to toggle watcher");
						throw err;
					} finally {
						setLoading(false);
					}
				},
			})),
			{
				name: "project-store",
				partialize: (state) => ({
					filters: state.filters,
					viewMode: state.viewMode,
				}),
			}
		)
	);
};
