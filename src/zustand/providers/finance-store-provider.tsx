"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { FinanceState, createFinanceStore } from "../stores/finance-store";

export type FinanceStoreApi = ReturnType<typeof createFinanceStore>;

export const FinanceStoreContext = createContext<FinanceStoreApi | undefined>(
	undefined
);

export interface FinanceStoreProviderProps {
	children: ReactNode;
}

export const FinanceStoreProvider = ({
	children,
}: FinanceStoreProviderProps) => {
	const storeRef = useRef<FinanceStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createFinanceStore();
	}

	return (
		<FinanceStoreContext.Provider value={storeRef.current}>
			{children}
		</FinanceStoreContext.Provider>
	);
};

export const useFinanceStore = <T,>(
	selector: (store: FinanceState) => T
): T => {
	const financeStoreContext = useContext(FinanceStoreContext);

	if (!financeStoreContext) {
		throw new Error(
			`useFinanceStore must be used within FinanceStoreProvider`
		);
	}

	return useStore(financeStoreContext, selector);
};
