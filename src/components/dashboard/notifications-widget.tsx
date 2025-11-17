"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/zustand/providers/dashboard-store-provider";
import { format } from "date-fns";
import React from "react";

interface NotificationsWidgetProps {
	initialData: Array<{
		id: string;
		type: string;
		content: string;
		source: string;
		timestamp: string;
	}>;
}

export function NotificationsWidget({ initialData }: NotificationsWidgetProps) {
	const { notifications, setNotifications } = useDashboardStore((state) => ({
		notifications: state.notifications,
		setNotifications: state.setNotifications,
	}));

	// Initialize with server data only once
	React.useEffect(() => {
		if (initialData.length > 0) {
			setNotifications(initialData);
		}
	}, []);

	const displayData = notifications.length > 0 ? notifications : initialData;

	return (
		<Card className="shadow-sm">
			<CardHeader>
				<CardTitle>Smart Notifications</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2">
					{displayData.map((notification) => (
						<li
							key={notification.id}
							className="p-2 rounded bg-muted"
						>
							<div className="flex justify-between">
								<div>
									<span className="font-medium">
										{notification.source}
									</span>
									: {notification.content.slice(0, 50)}...
									<br />
									<span className="text-xs text-muted-foreground">
										{format(
											new Date(notification.timestamp),
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
