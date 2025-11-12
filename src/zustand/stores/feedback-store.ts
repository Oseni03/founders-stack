import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface FeedbackItem {
	id: string;
	title: string;
	description: string;
	author: string;
	category: string;
	status: string;
	tags: string[];
	score: number;
	commentsCount: number;
	date: string;
	url?: string;
}

interface FeedbackData {
	totalFeedback: number;
	averageScore: number;
	totalComments: number;
	feedbackByStatus: Array<{
		name: string;
		value: number;
	}>;
	feedbackByCategory: Array<{
		name: string;
		value: number;
	}>;
	recentFeedback: FeedbackItem[];
	insight: string;
}

export interface FeedbackState {
	data: FeedbackData | null;
	loading: boolean;
	timeRange: string;
	selectedStatus: string | null;
	selectedCategory: string | null;
	error: string | null;

	setData: (data: FeedbackData) => void;
	setLoading: (loading: boolean) => void;
	setTimeRange: (range: string) => void;
	setSelectedStatus: (status: string | null) => void;
	setSelectedCategory: (category: string | null) => void;
	setError: (error: string | null) => void;
	clearError: () => void;

	addFeedback: (feedback: FeedbackItem) => void;
	updateFeedbackStatus: (feedbackId: string, status: string) => void;

	reset: () => void;
}

const initialFeedbackState = {
	data: null,
	loading: true,
	timeRange: "30d",
	selectedStatus: null,
	selectedCategory: null,
	error: null,
};

export const createFeedbackStore = () => {
	return create<FeedbackState>()(
		persist(
			immer((set) => ({
				...initialFeedbackState,

				setData: (data) => {
					set((state) => {
						state.data = data;
						state.loading = false;
						state.error = null;
					});
				},

				setLoading: (loading) => {
					set((state) => {
						state.loading = loading;
					});
				},

				setTimeRange: (range) => {
					set((state) => {
						state.timeRange = range;
					});
				},

				setSelectedStatus: (status) => {
					set((state) => {
						state.selectedStatus = status;
					});
				},

				setSelectedCategory: (category) => {
					set((state) => {
						state.selectedCategory = category;
					});
				},

				setError: (error) => {
					set((state) => {
						state.error = error;
					});
				},

				clearError: () => {
					set((state) => {
						state.error = null;
					});
				},

				addFeedback: (feedback) => {
					set((state) => {
						if (state.data) {
							state.data.recentFeedback.unshift(feedback);
							state.data.totalFeedback += 1;

							// Recalculate average score
							const totalScore = state.data.recentFeedback.reduce(
								(sum, item) => sum + item.score,
								0
							);
							state.data.averageScore =
								totalScore / state.data.recentFeedback.length;
						}
					});
				},

				updateFeedbackStatus: (feedbackId, status) => {
					set((state) => {
						if (state.data) {
							const feedbackIndex =
								state.data.recentFeedback.findIndex(
									(f) => f.id === feedbackId
								);

							if (feedbackIndex !== -1) {
								const oldStatus =
									state.data.recentFeedback[feedbackIndex]
										.status;
								state.data.recentFeedback[
									feedbackIndex
								].status = status;

								// Update status distribution
								const oldStatusIndex =
									state.data.feedbackByStatus.findIndex(
										(s) => s.name === oldStatus
									);
								const newStatusIndex =
									state.data.feedbackByStatus.findIndex(
										(s) => s.name === status
									);

								if (oldStatusIndex !== -1) {
									state.data.feedbackByStatus[
										oldStatusIndex
									].value -= 1;
								}

								if (newStatusIndex !== -1) {
									state.data.feedbackByStatus[
										newStatusIndex
									].value += 1;
								} else {
									state.data.feedbackByStatus.push({
										name: status,
										value: 1,
									});
								}
							}
						}
					});
				},

				reset: () => {
					set(initialFeedbackState);
				},
			})),
			{
				name: "feedback-store",
				partialize: (state) => ({
					timeRange: state.timeRange,
					selectedStatus: state.selectedStatus,
					selectedCategory: state.selectedCategory,
				}),
			}
		)
	);
};
