"use client";
import { useFeedbackStore } from "@/zustand/providers/feedback-store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export function FeedbackList() {
	const { feedbackItems, filters, setSelectedFeedback } = useFeedbackStore(
		(state) => ({
			feedbackItems: state.feedbackItems,
			filters: state.filters,
			setSelectedFeedback: state.setSelectedFeedback,
		})
	);

	const filteredItems = feedbackItems.filter((item) => {
		return (
			(filters.source === "all" || item.platform === filters.source) &&
			(filters.type === "all" || item.type === filters.type) &&
			(filters.status === "all" || item.status === filters.status) &&
			(filters.sentiment === "all" ||
				item.sentiment === filters.sentiment)
		);
	});

	const getSentimentIcon = (sentiment: string) => {
		switch (sentiment) {
			case "POSITIVE":
				return "😊";
			case "NEGATIVE":
				return "😡";
			case "NEUTRAL":
				return "😐";
			default:
				return "";
		}
	};

	return (
		<div className="space-y-4">
			{filteredItems.map((item) => (
				<Card
					key={item.id}
					className="hover:bg-muted/50 cursor-pointer"
					onClick={() => setSelectedFeedback(item)}
				>
					<CardHeader className="flex flex-row items-center gap-4">
						<span>{getSentimentIcon(item.sentiment || "")}</span>
						<CardTitle className="text-base">
							{item.title}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2 mb-2">
							<Badge variant="outline">{item.type}</Badge>
							<Badge variant="outline">{item.platform}</Badge>
							<Badge variant="outline">{item.status}</Badge>
							{item.priority && (
								<Badge variant="destructive">
									{item.priority}
								</Badge>
							)}
						</div>
						<p className="text-sm text-muted-foreground">
							{item.userEmail} •{" "}
							{new Date(item.createdAt).toLocaleString()}
						</p>
						{item.votes > 0 && (
							<p className="text-sm flex items-center gap-1">
								<Star className="w-4 h-4" /> {item.votes} votes
							</p>
						)}
						<div className="flex gap-2 mt-4">
							<Button variant="outline" size="sm">
								View Details
							</Button>
							{item.type === "BUG" && (
								<Button variant="outline" size="sm">
									Create Task
								</Button>
							)}
							{item.platform === "zendesk" && (
								<Button variant="outline" size="sm">
									Reply
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
