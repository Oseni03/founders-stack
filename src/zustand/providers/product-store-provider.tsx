"use client";

import {
	type ReactNode,
	createContext,
	useRef,
	useContext,
	useCallback,
} from "react";
import { useStore } from "zustand";
import { ProductStore, createProductStore } from "../stores/product-store";

export type ProductStoreApi = ReturnType<typeof createProductStore>;

export const ProductStoreContext = createContext<ProductStoreApi | undefined>(
	undefined
);

export interface ProductStoreProviderProps {
	children: ReactNode;
}

export const ProductStoreProvider = ({
	children,
}: ProductStoreProviderProps) => {
	const storeRef = useRef<ProductStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createProductStore();
	}

	return (
		<ProductStoreContext.Provider value={storeRef.current}>
			{children}
		</ProductStoreContext.Provider>
	);
};

export const useProductStore = <T,>(
	selector: (store: ProductStore) => T
): T => {
	const productStoreContext = useContext(ProductStoreContext);

	if (!productStoreContext) {
		throw new Error(
			`useProductStore must be used within productStoreProvider`
		);
	}

	// Memoize the selector to prevent infinite loops
	const memoizedSelector = useCallback(selector, [selector]);

	return useStore(productStoreContext, memoizedSelector);
};
