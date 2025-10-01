"use client";

import { createContext, useContext, useRef } from "react";
import {
	createSubscriptionStore,
	type SubscriptionStore,
} from "../stores/subscription-store";
import { useStore } from "zustand";

export type SubscriptionStoreApi = ReturnType<typeof createSubscriptionStore>;

const SubscriptionStoreContext = createContext<SubscriptionStoreApi | null>(
	null
);

interface SubscriptionStoreProviderProps {
	children: React.ReactNode;
}

export function SubscriptionStoreProvider({
	children,
}: SubscriptionStoreProviderProps) {
	const storeRef = useRef<SubscriptionStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createSubscriptionStore();
	}

	return (
		<SubscriptionStoreContext.Provider value={storeRef.current}>
			{children}
		</SubscriptionStoreContext.Provider>
	);
}

export const useSubscriptionStore = <T,>(
	selector: (store: SubscriptionStore) => T
): T => {
	const subscriptionStoreContext = useContext(SubscriptionStoreContext);

	if (!subscriptionStoreContext) {
		throw new Error(
			`useSubscriptionStore must be used within SubscriptionStoreProvider`
		);
	}

	return useStore(subscriptionStoreContext, selector);
};
