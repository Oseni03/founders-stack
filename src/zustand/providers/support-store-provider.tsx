"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { SupportState, createSupportStore } from "../stores/support-store";

export type SupportStoreApi = ReturnType<typeof createSupportStore>;

export const SupportStoreContext = createContext<SupportStoreApi | undefined>(
	undefined
);

export interface SupportStoreProviderProps {
	children: ReactNode;
}

export const SupportStoreProvider = ({
	children,
}: SupportStoreProviderProps) => {
	const storeRef = useRef<SupportStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createSupportStore();
	}

	return (
		<SupportStoreContext.Provider value={storeRef.current}>
			{children}
		</SupportStoreContext.Provider>
	);
};

export const useSupportStore = <T,>(
	selector: (store: SupportState) => T
): T => {
	const supportStoreContext = useContext(SupportStoreContext);

	if (!supportStoreContext) {
		throw new Error(
			`useSupportStore must be used within SupportStoreProvider`
		);
	}

	return useStore(supportStoreContext, selector);
};
