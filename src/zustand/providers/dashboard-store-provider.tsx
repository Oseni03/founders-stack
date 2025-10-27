"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import {
	DashboardState,
	createDashboardStore,
} from "../stores/dashboard-store";

export type DashboardStoreApi = ReturnType<typeof createDashboardStore>;

export const DashboardStoreContext = createContext<
	DashboardStoreApi | undefined
>(undefined);

export interface DashboardStoreProviderProps {
	children: ReactNode;
}

export const DashboardStoreProvider = ({
	children,
}: DashboardStoreProviderProps) => {
	const storeRef = useRef<DashboardStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createDashboardStore();
	}

	return (
		<DashboardStoreContext.Provider value={storeRef.current}>
			{children}
		</DashboardStoreContext.Provider>
	);
};

export const useDashboardStore = <T,>(
	selector: (store: DashboardState) => T
): T => {
	const dashboardStoreContext = useContext(DashboardStoreContext);

	if (!dashboardStoreContext) {
		throw new Error(
			`useDashboardStore must be used within dashboardStoreProvider`
		);
	}

	return useStore(dashboardStoreContext, selector);
};
