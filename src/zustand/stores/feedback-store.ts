import { FeedbackItem } from "@/types/feedback";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface FeedbackData {
	totalFeedback: number;
	averageSentimentScore: number;
	totalComments: number;
	npsScore: number;
	feedbackByStatus: Array<{ name: string; value: number }>;
	feedbackByCategory: Array<{ name: string; value: number }>;
	feedbackBySentiment: Array<{ name: string; value: number }>;
	recentFeedback: FeedbackItem[];
	topFeatureRequests: FeedbackItem[];
	sentimentTrend: Array<{
		date: string;
		positive: number;
		negative: number;
		neutral: number;
	}>;
	commonTerms: Array<{ term: string; count: number }>;
}

export interface FeedbackState {
	data: FeedbackData | null;
	loading: boolean;
	timeRange: string; // "7d", "30d", "custom"
	selectedSource: string | null; // "all", "zendesk", "usertesting", etc.
	selectedType: string | null; // "all", "feature_request", "bug", etc.
	selectedStatus: string | null; // "all", "NEW", etc.
	selectedSentiment: string | null; // "all", "POSITIVE", etc.
	selectedCategory: string | null;
	error: string | null;
	setData: (data: FeedbackData) => void;
	setLoading: (loading: boolean) => void;
	setTimeRange: (range: string) => void;
	setSelectedSource: (source: string | null) => void;
	setSelectedType: (type: string | null) => void;
	setSelectedStatus: (status: string | null) => void;
	setSelectedSentiment: (sentiment: string | null) => void;
	setSelectedCategory: (category: string | null) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
	addFeedback: (feedback: FeedbackItem) => void;
	updateFeedback: (
		feedbackId: string,
		updates: Partial<FeedbackItem>
	) => void;
	reset: () => void;
}

const initialFeedbackState: FeedbackState = {
	data: null,
	loading: true,
	timeRange: "30d",
	selectedSource: null,
	selectedType: null,
	selectedStatus: null,
	selectedSentiment: null,
	selectedCategory: null,
	error: null,
	setData: () => {},
	setLoading: () => {},
	setTimeRange: () => {},
	setSelectedSource: () => {},
	setSelectedType: () => {},
	setSelectedStatus: () => {},
	setSelectedSentiment: () => {},
	setSelectedCategory: () => {},
	setError: () => {},
	clearError: () => {},
	addFeedback: () => {},
	updateFeedback: () => {},
	reset: () => {},
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
				setSelectedSource: (source) => {
					set((state) => {
						state.selectedSource = source;
					});
				},
				setSelectedType: (type) => {
					set((state) => {
						state.selectedType = type;
					});
				},
				setSelectedStatus: (status) => {
					set((state) => {
						state.selectedStatus = status;
					});
				},
				setSelectedSentiment: (sentiment) => {
					set((state) => {
						state.selectedSentiment = sentiment;
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
							state.data.totalComments += feedback.commentsCount;

							// Update sentiment score
							const totalSentiment =
								state.data.recentFeedback.reduce(
									(sum, item) =>
										sum + (item.sentimentScore || 0),
									0
								);
							state.data.averageSentimentScore =
								totalSentiment /
								state.data.recentFeedback.length;

							// Update status distribution
							const statusIndex =
								state.data.feedbackByStatus.findIndex(
									(s) => s.name === feedback.status
								);
							if (statusIndex !== -1) {
								state.data.feedbackByStatus[
									statusIndex
								].value += 1;
							} else {
								state.data.feedbackByStatus.push({
									name: feedback.status,
									value: 1,
								});
							}

							// Update category distribution
							if (feedback.category) {
								const categoryIndex =
									state.data.feedbackByCategory.findIndex(
										(c) => c.name === feedback.category
									);
								if (categoryIndex !== -1) {
									state.data.feedbackByCategory[
										categoryIndex
									].value += 1;
								} else {
									state.data.feedbackByCategory.push({
										name: feedback.category,
										value: 1,
									});
								}
							}

							// Update sentiment distribution
							if (feedback.sentiment) {
								const sentimentIndex =
									state.data.feedbackBySentiment.findIndex(
										(s) => s.name === feedback.sentiment
									);
								if (sentimentIndex !== -1) {
									state.data.feedbackBySentiment[
										sentimentIndex
									].value += 1;
								} else {
									state.data.feedbackBySentiment.push({
										name: feedback.sentiment,
										value: 1,
									});
								}
							}
						}
					});
				},
				updateFeedback: (feedbackId, updates) => {
					set((state) => {
						if (state.data) {
							const feedbackIndex =
								state.data.recentFeedback.findIndex(
									(f) => f.id === feedbackId
								);
							if (feedbackIndex !== -1) {
								const oldFeedback =
									state.data.recentFeedback[feedbackIndex];
								state.data.recentFeedback[feedbackIndex] = {
									...oldFeedback,
									...updates,
								};

								// Update status distribution if status changed
								if (
									updates.status &&
									updates.status !== oldFeedback.status
								) {
									const oldStatusIndex =
										state.data.feedbackByStatus.findIndex(
											(s) => s.name === oldFeedback.status
										);
									const newStatusIndex =
										state.data.feedbackByStatus.findIndex(
											(s) => s.name === updates.status
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
											name: updates.status,
											value: 1,
										});
									}
								}

								// Update category distribution if category changed
								if (
									updates.category &&
									updates.category !== oldFeedback.category
								) {
									if (oldFeedback.category) {
										const oldCategoryIndex =
											state.data.feedbackByCategory.findIndex(
												(c) =>
													c.name ===
													oldFeedback.category
											);
										if (oldCategoryIndex !== -1) {
											state.data.feedbackByCategory[
												oldCategoryIndex
											].value -= 1;
										}
									}
									const newCategoryIndex =
										state.data.feedbackByCategory.findIndex(
											(c) => c.name === updates.category
										);
									if (newCategoryIndex !== -1) {
										state.data.feedbackByCategory[
											newCategoryIndex
										].value += 1;
									} else {
										state.data.feedbackByCategory.push({
											name: updates.category,
											value: 1,
										});
									}
								}

								// Update sentiment distribution if sentiment changed
								if (
									updates.sentiment &&
									updates.sentiment !== oldFeedback.sentiment
								) {
									if (oldFeedback.sentiment) {
										const oldSentimentIndex =
											state.data.feedbackBySentiment.findIndex(
												(s) =>
													s.name ===
													oldFeedback.sentiment
											);
										if (oldSentimentIndex !== -1) {
											state.data.feedbackBySentiment[
												oldSentimentIndex
											].value -= 1;
										}
									}
									const newSentimentIndex =
										state.data.feedbackBySentiment.findIndex(
											(s) => s.name === updates.sentiment
										);
									if (newSentimentIndex !== -1) {
										state.data.feedbackBySentiment[
											newSentimentIndex
										].value += 1;
									} else {
										state.data.feedbackBySentiment.push({
											name: updates.sentiment,
											value: 1,
										});
									}
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
					selectedSource: state.selectedSource,
					selectedType: state.selectedType,
					selectedStatus: state.selectedStatus,
					selectedSentiment: state.selectedSentiment,
					selectedCategory: state.selectedCategory,
				}),
			}
		)
	);
};

export const useFeedbackStore = createFeedbackStore();
