"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStore } from "@/zustand/providers/dashboard-store-provider";
import { cn } from "@/lib/utils";
import React from "react";

interface TeamPulseWidgetProps {
	initialData: Array<{
		user: string;
		status: "online" | "away" | "offline";
		currentTask: string;
	}>;
}

export function TeamPulseWidget({ initialData }: TeamPulseWidgetProps) {
	const { teamPulse, setTeamPulse } = useDashboardStore((state) => ({
		teamPulse: state.teamPulse,
		setTeamPulse: state.setTeamPulse,
	}));

	// Initialize with server data only once
	React.useEffect(() => {
		if (initialData.length > 0) {
			setTeamPulse(initialData);
		}
	}, []);

	const displayData = teamPulse.length > 0 ? teamPulse : initialData;

	return (
		<Card className="shadow-sm">
			<CardHeader>
				<CardTitle>Team Pulse</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2">
					{displayData.map((member, index) => (
						<li key={index} className="p-2 rounded bg-muted">
							<div className="flex justify-between">
								<span>
									<span
										className={cn(
											"inline-block h-2 w-2 rounded-full mr-2",
											member.status === "online"
												? "bg-green-500"
												: member.status === "away"
													? "bg-yellow-500"
													: "bg-red-500"
										)}
									/>
									{member.user}
								</span>
								<span className="text-sm text-muted-foreground">
									{member.currentTask || "Idle"}
								</span>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
