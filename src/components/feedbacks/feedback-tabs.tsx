"use client";
import { useFeedbackStore } from "@/zustand/providers/feedback-store-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackList } from "./feedback-list";
import { TopFeatureRequests } from "./top-feature-requests";
import { SentimentChart } from "./sentiment-chart";
import { UserTestingSessions } from "./user-testing-sessions";
import { FeedbackItem } from "@/zustand/stores/feedback-store";

interface FeedbackTabsProps {
	initialFeedback: FeedbackItem[];
}

export function FeedbackTabs({ initialFeedback }: FeedbackTabsProps) {
	const { activeTab, setActiveTab, setFeedbackItems } = useFeedbackStore(
		(state) => ({
			activeTab: state.activeTab,
			setActiveTab: state.setActiveTab,
			setFeedbackItems: state.setFeedbackItems,
		})
	);

	// Initialize feedback items
	setFeedbackItems(initialFeedback);

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
			<TabsList className="grid w-full grid-cols-4">
				<TabsTrigger value="list">Feedback List</TabsTrigger>
				<TabsTrigger value="features">Top Features</TabsTrigger>
				<TabsTrigger value="sentiment">Sentiment</TabsTrigger>
				<TabsTrigger value="testing">User Testing</TabsTrigger>
			</TabsList>
			<TabsContent value="list">
				<FeedbackList />
			</TabsContent>
			<TabsContent value="features">
				<TopFeatureRequests />
			</TabsContent>
			<TabsContent value="sentiment">
				<SentimentChart />
			</TabsContent>
			<TabsContent value="testing">
				<UserTestingSessions />
			</TabsContent>
		</Tabs>
	);
}
