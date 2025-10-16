"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { TaskState, createTaskStore } from "../stores/tasks-store";

export type TaskStoreApi = ReturnType<typeof createTaskStore>;

export const TaskStoreContext = createContext<TaskStoreApi | undefined>(
	undefined
);

export interface TaskStoreProviderProps {
	children: ReactNode;
}

export const TaskStoreProvider = ({ children }: TaskStoreProviderProps) => {
	const storeRef = useRef<TaskStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createTaskStore();
	}

	return (
		<TaskStoreContext.Provider value={storeRef.current}>
			{children}
		</TaskStoreContext.Provider>
	);
};

export const useTaskStore = <T,>(selector: (store: TaskState) => T): T => {
	const tasksStoreContext = useContext(TaskStoreContext);

	if (!tasksStoreContext) {
		throw new Error(`useTaskStore must be used within TaskStoreProvider`);
	}

	return useStore(tasksStoreContext, selector);
};
