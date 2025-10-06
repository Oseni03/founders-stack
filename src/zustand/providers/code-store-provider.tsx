"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { CodeState, createCodeStore } from "../stores/code-store";

export type CodeStoreApi = ReturnType<typeof createCodeStore>;

export const CodeStoreContext = createContext<CodeStoreApi | undefined>(
	undefined
);

export interface CodeStoreProviderProps {
	children: ReactNode;
}

export const CodeStoreProvider = ({ children }: CodeStoreProviderProps) => {
	const storeRef = useRef<CodeStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createCodeStore();
	}

	return (
		<CodeStoreContext.Provider value={storeRef.current}>
			{children}
		</CodeStoreContext.Provider>
	);
};

export const useCodeStore = <T,>(selector: (store: CodeState) => T): T => {
	const codeStoreContext = useContext(CodeStoreContext);

	if (!codeStoreContext) {
		throw new Error(`useCodeStore must be used within codeStoreProvider`);
	}

	return useStore(codeStoreContext, selector);
};
