/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { Project, Task } from "@prisma/client";
// NOTE: use client-side API route for deletions instead of importing server functions

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
						const res = await fetch(
							`/api/products/${productId}/project-health?range=${range}`
						);
						if (!res.ok) throw new Error(await res.text());
						const { data, projects } = await res.json();
						setData(data);
						setProjects(projects);
					} catch (err: any) {
						setError(err.message);
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
						setError("Organization ID is required");
						return;
					}

					setLoading(true);
					setError(null);

					try {
						// Find the project to get sourceTool
						const project = get().projects.find(
							(p) => p.id === taskData.projectId
						);
						if (!project) {
							throw new Error("Project not found");
						}

						// Create task in the integrated platform and local DB
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
							throw new Error(
								errorText || "Failed to create task"
							);
						}

						const newTask: Task = await res.json();

						// Update local state
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
						setError(err.message);
						throw err;
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
						setError("Organization ID is required");
						return;
					}

					setLoading(true);
					setError(null);

					try {
						// Find the task to get sourceTool
						const task = data?.tasks.find((t) => t.id === taskId);
						if (!task) {
							throw new Error("Task not found");
						}

						const project = get().projects.find(
							(p) => p.id === task.projectId
						);
						if (!project) {
							throw new Error("Project not found");
						}

						// Update task in the integrated platform and local DB
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
							throw new Error(
								errorText || "Failed to update task"
							);
						}

						const updatedTask: Task = await res.json();

						// Update local state
						if (data) {
							const updatedTasks = data.tasks.map((t) =>
								t.id === taskId ? updatedTask : t
							);

							// Recalculate openTasks
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
						setError(err.message);
						throw err;
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
						setError("Organization ID is required");
						return;
					}

					if (!productId) {
						setError("Product ID is required");
						return;
					}

					if (!taskId) {
						setError("Task ID is required");
						return;
					}

					setLoading(true);
					setError(null);

					try {
						// Call API route to delete task
						const res = await fetch(
							`/api/products/${productId}/tasks/${taskId}`,
							{
								method: "DELETE",
								headers: { "Content-Type": "application/json" },
							}
						);

						if (!res.ok) {
							const errText = await res.text();
							throw new Error(errText || "Failed to delete task");
						}

						// Update local state
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
						setError(err.message);
						throw err;
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
