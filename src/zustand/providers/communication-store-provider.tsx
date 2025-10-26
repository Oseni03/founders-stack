"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import {
	CommunicationState,
	createCommunicationStore,
} from "../stores/communication-store";

export type CommunicationStoreApi = ReturnType<typeof createCommunicationStore>;

export const CommunicationStoreContext = createContext<
	CommunicationStoreApi | undefined
>(undefined);

export interface CommunicationStoreProviderProps {
	children: ReactNode;
}

export const CommunicationStoreProvider = ({
	children,
}: CommunicationStoreProviderProps) => {
	const storeRef = useRef<CommunicationStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createCommunicationStore();
	}

	return (
		<CommunicationStoreContext.Provider value={storeRef.current}>
			{children}
		</CommunicationStoreContext.Provider>
	);
};

export const useCommunicationStore = <T,>(
	selector: (store: CommunicationState) => T
): T => {
	const communicationsStoreContext = useContext(CommunicationStoreContext);

	if (!communicationsStoreContext) {
		throw new Error(
			`useCommunicationStore must be used within CommunicationStoreProvider`
		);
	}

	return useStore(communicationsStoreContext, selector);
};
