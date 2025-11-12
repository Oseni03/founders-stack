/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { Project, Task } from "@prisma/client";
import { logger } from "@/lib/logger";

export interface ProjectMetrics {
	openTasks: number;
	velocity: number[];
	overdueTasks: number;
	tasks: Task[];
	insight: string;
}

export interface TaskFormData {
	title: string;
	description?: string;
	status: "open" | "in_progress" | "done" | null;
	priority: "low" | "medium" | "high" | "urgent" | null;
	assignee: string | null;
	dueDate?: string | Date;
	projectId: string;
	labels?: string[];
}

export interface ProjectState {
	data: ProjectMetrics | null;
	projects: Project[];
	loading: boolean;
	error: string | null;
	range: "7d" | "30d" | "90d";
	organizationId: string | null;

	setData: (data: ProjectMetrics | null) => void;
	setProjects: (projects: Project[]) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	setRange: (range: "7d" | "30d" | "90d") => void;
	setOrganizationId: (id: string) => void;
	clearError: () => void;

	fetchData: (
		productId: string,
		range: "7d" | "30d" | "90d"
	) => Promise<void>;
	createTask: (data: TaskFormData) => Promise<void>;
	updateTask: (taskId: string, data: Partial<TaskFormData>) => Promise<void>;
	deleteTask: (productId: string, taskId: string) => Promise<void>;
}

export const createProjectStore = () => {
	return create<ProjectState>()(
		persist(
			immer((set, get) => ({
				data: null,
				projects: [],
				loading: false,
				error: null,
				range: "30d",
				organizationId: null,

				setData: (data) =>
					set((state) => {
						state.data = data;
					}),

				setProjects: (projects) =>
					set((state) => {
						state.projects = projects;
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

				setOrganizationId: (id) =>
					set((state) => {
						state.organizationId = id;
					}),

				clearError: () =>
					set((state) => {
						state.error = null;
					}),

				fetchData: async (productId, range) => {
					const {
						setLoading,
						setData,
						setProjects,
						setError,
						setRange,
					} = get();
					setLoading(true);
					setError(null);
					setRange(range);

					try {
						logger.info("Fetching project data", {
							productId,
							range,
						});
						const res = await fetch(
							`/api/products/${productId}/project-health?range=${range}`
						);
						if (!res.ok) {
							const errorText = await res.text();
							throw new Error(errorText);
						}
						const { data, projects } = await res.json();
						logger.info("Project data fetched successfully", {
							taskCount: data?.tasks?.length || 0,
							projectCount: projects?.length || 0,
						});
						setData(data);
						setProjects(projects);
					} catch (err: any) {
						logger.error("Error fetching project data", {
							error: err,
							productId,
							range,
						});
						setError(err.message || "Failed to fetch project data");
					} finally {
						setLoading(false);
					}
				},

				createTask: async (taskData) => {
					const {
						organizationId,
						setLoading,
						setError,
						data,
						setData,
					} = get();

					if (!organizationId) {
						const errorMsg = "Organization ID is required";
						logger.error(
							"Cannot create task: Organization ID is missing"
						);
						setError(errorMsg);
						return Promise.reject(new Error(errorMsg));
					}

					const project = get().projects.find(
						(p) => p.id === taskData.projectId
					);
					if (!project) {
						const errorMsg = "Project not found";
						setError(errorMsg);
						return Promise.reject(new Error(errorMsg));
					}

					setLoading(true);
					setError(null);

					try {
						logger.info("Creating task", {
							projectId: taskData.projectId,
							projectName: project.name,
							sourceTool: project.sourceTool,
							title: taskData.title,
						});

						const res = await fetch(
							`/api/integrations/${project.sourceTool}/resources/tasks`,
							{
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									...taskData,
									organizationId,
								}),
							}
						);

						if (!res.ok) {
							const errorText = await res.text();
							logger.error("Task creation API failed", {
								status: res.status,
								error: errorText,
								projectId: taskData.projectId,
							});
							throw new Error(
								errorText || "Failed to create task"
							);
						}

						const newTask: Task = await res.json();

						logger.info("Task created successfully", {
							taskId: newTask.id,
							title: newTask.title,
							sourceTool: project.sourceTool,
						});

						// Update local state only on success
						if (data) {
							setData({
								...data,
								tasks: [...data.tasks, newTask],
								openTasks:
									newTask.status === "open"
										? data.openTasks + 1
										: data.openTasks,
							});
						}
					} catch (err: any) {
						logger.error("Error creating task", {
							error: err,
							taskData,
						});
						const errorMessage =
							err.message || "Failed to create task";
						setError(errorMessage);
						return Promise.reject(err);
					} finally {
						setLoading(false);
					}
				},

				updateTask: async (taskId, updates) => {
					const {
						organizationId,
						setLoading,
						setError,
						data,
						setData,
					} = get();

					if (!organizationId) {
						const errorMsg = "Organization ID is required";
						logger.error(
							"Cannot update task: Organization ID is missing"
						);
						setError(errorMsg);
						return Promise.reject(new Error(errorMsg));
					}

					const task = data?.tasks.find((t) => t.id === taskId);
					if (!task) {
						const errorMsg = "Task not found";
						setError(errorMsg);
						return Promise.reject(new Error(errorMsg));
					}

					const project = get().projects.find(
						(p) => p.id === task.projectId
					);
					if (!project) {
						const errorMsg = "Project not found";
						setError(errorMsg);
						return Promise.reject(new Error(errorMsg));
					}

					setLoading(true);
					setError(null);

					try {
						logger.info("Updating task", {
							taskId,
							title: task.title,
							sourceTool: project.sourceTool,
							updates,
						});

						const res = await fetch(
							`/api/integrations/${project.sourceTool}/resources/tasks/${taskId}`,
							{
								method: "PATCH",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									...updates,
									organizationId,
								}),
							}
						);

						if (!res.ok) {
							const errorText = await res.text();
							logger.error("Task update API failed", {
								taskId,
								status: res.status,
								error: errorText,
							});
							throw new Error(
								errorText || "Failed to update task"
							);
						}

						const updatedTask: Task = await res.json();

						logger.info("Task updated successfully", {
							taskId,
							title: updatedTask.title,
							sourceTool: project.sourceTool,
						});

						// Update local state only on success
						if (data) {
							const updatedTasks = data.tasks.map((t) =>
								t.id === taskId ? updatedTask : t
							);

							const openTasks = updatedTasks.filter(
								(t) => t.status === "open"
							).length;

							setData({
								...data,
								tasks: updatedTasks,
								openTasks,
							});
						}
					} catch (err: any) {
						logger.error("Error updating task", {
							taskId,
							error: err,
						});
						const errorMessage =
							err.message || "Failed to update task";
						setError(errorMessage);
						return Promise.reject(err);
					} finally {
						setLoading(false);
					}
				},

				deleteTask: async (productId: string, taskId: string) => {
					const {
						organizationId,
						setLoading,
						setError,
						data,
						setData,
					} = get();

					if (!organizationId) {
						const errorMsg = "Organization ID is required";
						logger.error(
							"Cannot delete task: Organization ID is missing"
						);
						setError(errorMsg);
						return Promise.reject(new Error(errorMsg));
					}

					if (!productId) {
						const errorMsg = "Product ID is required";
						logger.error(
							"Cannot delete task: Product ID is missing"
						);
						setError(errorMsg);
						return Promise.reject(new Error(errorMsg));
					}

					if (!taskId) {
						const errorMsg = "Task ID is required";
						logger.error("Cannot delete task: Task ID is missing");
						setError(errorMsg);
						return Promise.reject(new Error(errorMsg));
					}

					setLoading(true);
					setError(null);

					try {
						logger.info("Deleting task", { taskId, productId });

						const res = await fetch(
							`/api/products/${productId}/tasks/${taskId}`,
							{
								method: "DELETE",
								headers: { "Content-Type": "application/json" },
							}
						);

						if (!res.ok) {
							const errText = await res.text();
							logger.error("Task deletion API failed", {
								taskId,
								status: res.status,
								error: errText,
							});
							throw new Error(errText || "Failed to delete task");
						}

						logger.info("Task deleted successfully", { taskId });

						// Update local state only on success
						if (data) {
							const taskToDelete = data.tasks.find(
								(t) => t.id === taskId
							);
							const updatedTasks = data.tasks.filter(
								(t) => t.id !== taskId
							);

							setData({
								...data,
								tasks: updatedTasks,
								openTasks:
									taskToDelete?.status === "open"
										? data.openTasks - 1
										: data.openTasks,
							});
						}
					} catch (err: any) {
						logger.error("Error deleting task", {
							taskId,
							error: err,
						});
						const errorMessage =
							err.message || "Failed to delete task";
						setError(errorMessage);
						return Promise.reject(err);
					} finally {
						setLoading(false);
					}
				},
			})),
			{
				name: "project-store",
				partialize: (state) => ({
					range: state.range,
					organizationId: state.organizationId,
				}),
			}
		)
	);
};
