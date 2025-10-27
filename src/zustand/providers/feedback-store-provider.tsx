"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";
import { FeedbackState, createFeedbackStore } from "../stores/feedback-store";

export type FeedbackStoreApi = ReturnType<typeof createFeedbackStore>;

export const FeedbackStoreContext = createContext<FeedbackStoreApi | undefined>(
	undefined
);

export interface FeedbackStoreProviderProps {
	children: ReactNode;
}

export const FeedbackStoreProvider = ({
	children,
}: FeedbackStoreProviderProps) => {
	const storeRef = useRef<FeedbackStoreApi | null>(null);
	if (storeRef.current === null) {
		storeRef.current = createFeedbackStore();
	}

	return (
		<FeedbackStoreContext.Provider value={storeRef.current}>
			{children}
		</FeedbackStoreContext.Provider>
	);
};

export const useFeedbackStore = <T,>(
	selector: (store: FeedbackState) => T
): T => {
	const feedbackStoreContext = useContext(FeedbackStoreContext);

	if (!feedbackStoreContext) {
		throw new Error(
			`useFeedbackStore must be used within FeedbackStoreProvider`
		);
	}

	return useStore(feedbackStoreContext, selector);
};
