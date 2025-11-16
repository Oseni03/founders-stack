import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type {
	Task as BaseTask,
	Comment,
	LinkedItem,
	Project,
	TaskWatcher,
	User,
} from "@prisma/client";

export interface commentType extends Comment {
	author: User;
}

export interface Task extends BaseTask {
	project: Project;
	linkedItems: LinkedItem[];
	watchers: TaskWatcher[];
	comments: commentType[];
}

export interface TaskFilters {
	view: "my-tasks" | "team-tasks" | "all-projects" | "sprints";
	status: string[];
	priority: string[];
	assignee: string[];
	project: string[];
	dateRange: "week" | "month" | "overdue" | "custom";
	customStart?: string;
	customEnd?: string;
}

export interface TasksState {
	tasks: Task[];
	projects: Project[];
	filters: TaskFilters;
	selectedTask: Task | null;
	viewMode: "list" | "board" | "calendar" | "sprint";
	setTasks: (tasks: Task[]) => void;
	setProjects: (projects: Project[]) => void;
	setFilters: (filters: Partial<TaskFilters>) => void;
	setSelectedTask: (task: Task | null) => void;
	setViewMode: (mode: "list" | "board" | "calendar" | "sprint") => void;
}

export const createTasksStore = () => {
	return create<TasksState>()(
		persist(
			immer(
				subscribeWithSelector((set) => ({
					tasks: [],
					projects: [],
					filters: {
						view: "my-tasks",
						status: [],
						priority: [],
						assignee: [],
						project: [],
						dateRange: "week",
					},
					selectedTask: null,
					viewMode: "list",
					setTasks: (tasks) => set({ tasks }),
					setProjects: (projects) => set({ projects }),
					setFilters: (newFilters) =>
						set((state) => ({
							filters: { ...state.filters, ...newFilters },
						})),
					setSelectedTask: (selectedTask) => set({ selectedTask }),
					setViewMode: (viewMode) => set({ viewMode }),
				}))
			),
			{ name: "tasks-store" }
		)
	);
};
