"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { ProjectState, createProjectStore } from "../stores/project-store";

export type ProjectStoreApi = ReturnType<typeof createProjectStore>;

export const ProjectStoreContext = createContext<ProjectStoreApi | undefined>(
	undefined
);

export interface ProjectStoreProviderProps {
	children: ReactNode;
}

export const ProjectStoreProvider = ({
	children,
}: ProjectStoreProviderProps) => {
	const storeRef = useRef<ProjectStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createProjectStore();
	}

	return (
		<ProjectStoreContext.Provider value={storeRef.current}>
			{children}
		</ProjectStoreContext.Provider>
	);
};

export const useProjectStore = <T,>(
	selector: (store: ProjectState) => T
): T => {
	const projectsStoreContext = useContext(ProjectStoreContext);

	if (!projectsStoreContext) {
		throw new Error(
			`useProjectStore must be used within ProjectStoreProvider`
		);
	}

	return useStore(projectsStoreContext, selector);
};
