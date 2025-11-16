"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { DesignState, createDesignStore } from "../stores/design-store";

export type DesignStoreApi = ReturnType<typeof createDesignStore>;
export const DesignStoreContext = createContext<DesignStoreApi | undefined>(
	undefined
);

export interface DesignStoreProviderProps {
	children: ReactNode;
}

export const DesignStoreProvider = ({ children }: DesignStoreProviderProps) => {
	const storeRef = useRef<DesignStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createDesignStore();
	}
	return (
		<DesignStoreContext.Provider value={storeRef.current}>
			{children}
		</DesignStoreContext.Provider>
	);
};

export const useDesignStore = <T,>(selector: (store: DesignState) => T): T => {
	const designStoreContext = useContext(DesignStoreContext);
	if (!designStoreContext) {
		throw new Error(
			"useDesignStore must be used within DesignStoreProvider"
		);
	}
	return useStore(designStoreContext, selector);
};
