"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/zustand/providers/dashboard-store-provider";
import { format } from "date-fns";
import React from "react";
import type { User } from "@prisma/client";

interface ActivityTimelineWidgetProps {
	initialData: Array<{
		id: string;
		user: User;
		action: string;
		item: string;
		timestamp: string;
	}>;
}

export function ActivityTimelineWidget({
	initialData,
}: ActivityTimelineWidgetProps) {
	const { recentActivity, setRecentActivity } = useDashboardStore(
		(state) => ({
			recentActivity: state.recentActivity,
			setRecentActivity: state.setRecentActivity,
		})
	);

	// Initialize with server data only once
	React.useEffect(() => {
		if (initialData.length > 0) {
			setRecentActivity(initialData);
		}
	}, []);

	const displayData =
		recentActivity.length > 0 ? recentActivity : initialData;

	return (
		<Card className="shadow-sm">
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2">
					{displayData.map((activity) => (
						<li key={activity.id} className="p-2 rounded bg-muted">
							<div className="flex justify-between">
								<div>
									<span className="font-medium">
										{activity.user.name}
									</span>{" "}
									{activity.action}:{" "}
									{activity.item.slice(0, 50)}...
									<br />
									<span className="text-xs text-muted-foreground">
										{format(
											new Date(activity.timestamp),
											"PPp"
										)}
									</span>
								</div>
								<Button variant="ghost" size="sm">
									View
								</Button>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
