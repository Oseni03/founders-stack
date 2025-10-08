"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import {
	IntegrationsState,
	createIntegrationsStore,
} from "../stores/integrations-store";

export type IntegrationsStoreApi = ReturnType<typeof createIntegrationsStore>;

export const IntegrationsStoreContext = createContext<
	IntegrationsStoreApi | undefined
>(undefined);

export interface IntegrationsStoreProviderProps {
	children: ReactNode;
}

export const IntegrationsStoreProvider = ({
	children,
}: IntegrationsStoreProviderProps) => {
	const storeRef = useRef<IntegrationsStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createIntegrationsStore();
	}

	return (
		<IntegrationsStoreContext.Provider value={storeRef.current}>
			{children}
		</IntegrationsStoreContext.Provider>
	);
};

export const useIntegrationsStore = <T,>(
	selector: (store: IntegrationsState) => T
): T => {
	const integrationsStoreContext = useContext(IntegrationsStoreContext);

	if (!integrationsStoreContext) {
		throw new Error(
			`useIntegrationsStore must be used within IntegrationsStoreProvider`
		);
	}

	return useStore(integrationsStoreContext, selector);
};
