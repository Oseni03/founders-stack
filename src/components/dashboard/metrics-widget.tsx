"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStore } from "@/zustand/providers/dashboard-store-provider";
import React from "react";

interface MetricsWidgetProps {
	initialData: Array<{
		name: string;
		value: number;
		unit: string;
		trend: number;
		health: "good" | "warning" | "critical";
	}>;
}

export function MetricsWidget({ initialData }: MetricsWidgetProps) {
	const { metrics, setMetrics } = useDashboardStore((state) => ({
		metrics: state.metrics,
		setMetrics: state.setMetrics,
	}));

	// Initialize with server data only once
	React.useEffect(() => {
		if (initialData.length > 0) {
			setMetrics(initialData);
		}
	}, []);

	const displayData = metrics.length > 0 ? metrics : initialData;

	return (
		<Card className="shadow-sm">
			<CardHeader>
				<CardTitle>Key Metrics</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid gap-4">
					{displayData.map((metric, index) => (
						<div key={index} className="flex justify-between">
							<span>{metric.name}</span>
							<div className="text-right">
								<div>
									{metric.value} {metric.unit}
								</div>
								<span
									className={`text-xs ${
										metric.health === "good"
											? "text-green-600"
											: metric.health === "warning"
												? "text-yellow-600"
												: "text-red-600"
									}`}
								>
									{metric.trend > 0
										? "↑"
										: metric.trend < 0
											? "↓"
											: "→"}{" "}
									{Math.abs(metric.trend)}%
								</span>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
