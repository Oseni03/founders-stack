"use client";
import { useFeedbackStore } from "@/zustand/providers/feedback-store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UserTestingSessions() {
	const { feedbackItems } = useFeedbackStore((state) => ({
		feedbackItems: state.feedbackItems,
	}));

	const testingSessions = feedbackItems.filter(
		(item) => item.platform === "usertesting"
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>User Testing Sessions</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{testingSessions.map((item) => (
						<div
							key={item.id}
							className="flex justify-between items-center"
						>
							<div>
								<p className="font-medium">{item.title}</p>
								<p className="text-sm text-muted-foreground">
									{new Date(item.createdAt).toLocaleString()}
								</p>
							</div>
							<Button variant="outline" size="sm">
								View Session
							</Button>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
