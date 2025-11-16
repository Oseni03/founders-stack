"use client";
import { useFeedbackStore } from "@/zustand/providers/feedback-store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TopFeatureRequests() {
	const { feedbackItems } = useFeedbackStore((state) => ({
		feedbackItems: state.feedbackItems,
	}));

	const featureRequests = feedbackItems
		.filter((item) => item.type === "FEATURE_REQUEST")
		.sort((a, b) => b.votes - a.votes);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Top Feature Requests</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{featureRequests.map((item) => (
						<div
							key={item.id}
							className="flex justify-between items-center"
						>
							<div>
								<p className="font-medium">{item.title}</p>
								<div className="flex gap-2 mt-1">
									<Badge>{item.votes} votes</Badge>
									<Badge variant="outline">
										{item.status}
									</Badge>
								</div>
							</div>
							<Button variant="outline" size="sm">
								Update Status
							</Button>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
