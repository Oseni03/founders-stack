import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
	FeedbackItem as BaseFeedbackItem,
	LinkedItem,
} from "@prisma/client";

export interface FeedbackItem extends BaseFeedbackItem {
	linkedItems: LinkedItem[];
}

export interface FeedbackState {
	feedbackItems: FeedbackItem[];
	selectedFeedback: FeedbackItem | null;
	filters: {
		source: string;
		type: string;
		status: string;
		sentiment: string;
		dateRange: string;
	};
	activeTab: string;
	setFeedbackItems: (items: FeedbackItem[]) => void;
	setSelectedFeedback: (feedback: FeedbackItem | null) => void;
	setFilters: (filters: Partial<FeedbackState["filters"]>) => void;
	setActiveTab: (tab: string) => void;
}

export const createFeedbackStore = () => {
	return create<FeedbackState>()(
		persist(
			immer((set) => ({
				feedbackItems: [],
				filters: {
					source: "all",
					type: "all",
					status: "all",
					sentiment: "all",
					dateRange: "last7days",
				},
				activeTab: "list",
				selectedFeedback: null,
				setFeedbackItems: (items) => set({ feedbackItems: items }),
				setSelectedFeedback: (selectedFeedback) =>
					set({ selectedFeedback }),
				setFilters: (newFilters) =>
					set((state) => ({
						filters: { ...state.filters, ...newFilters },
					})),
				setActiveTab: (tab) => set({ activeTab: tab }),
			})),
			{ name: "feedback-store" }
		)
	);
};
