"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { TasksState, createTasksStore } from "../stores/task-store";

export type TasksStoreApi = ReturnType<typeof createTasksStore>;
export const TasksStoreContext = createContext<TasksStoreApi | undefined>(
	undefined
);

export interface TasksStoreProviderProps {
	children: ReactNode;
}

export const TasksStoreProvider = ({ children }: TasksStoreProviderProps) => {
	const storeRef = useRef<TasksStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createTasksStore();
	}
	return (
		<TasksStoreContext.Provider value={storeRef.current}>
			{children}
		</TasksStoreContext.Provider>
	);
};

export const useTasksStore = <T,>(selector: (store: TasksState) => T): T => {
	const tasksStoreContext = useContext(TasksStoreContext);
	if (!tasksStoreContext) {
		throw new Error("useTasksStore must be used within TasksStoreProvider");
	}
	return useStore(tasksStoreContext, selector);
};
