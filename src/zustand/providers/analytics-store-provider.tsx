"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import {
	AnalyticsState,
	createAnalyticsStore,
} from "../stores/analytics-store";

export type AnalyticsStoreApi = ReturnType<typeof createAnalyticsStore>;

export const AnalyticsStoreContext = createContext<
	AnalyticsStoreApi | undefined
>(undefined);

export interface AnalyticsStoreProviderProps {
	children: ReactNode;
}

export const AnalyticsStoreProvider = ({
	children,
}: AnalyticsStoreProviderProps) => {
	const storeRef = useRef<AnalyticsStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createAnalyticsStore();
	}

	return (
		<AnalyticsStoreContext.Provider value={storeRef.current}>
			{children}
		</AnalyticsStoreContext.Provider>
	);
};

export const useAnalyticsStore = <T,>(
	selector: (store: AnalyticsState) => T
): T => {
	const analyticsStoreContext = useContext(AnalyticsStoreContext);

	if (!analyticsStoreContext) {
		throw new Error(
			`useAnalyticsStore must be used within analyticsStoreProvider`
		);
	}

	return useStore(analyticsStoreContext, selector);
};
