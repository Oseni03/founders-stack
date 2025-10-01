/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Line,
	LineChart,
	Bar,
	BarChart,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";
import type { LucideIcon } from "lucide-react";

export interface ChartWidgetProps {
	title: string;
	description?: string;
	endpoint: string;
	chartType: "line" | "bar";
	dataKeys: { key: string; label: string; color: string }[];
	xAxisKey: string;
	icon?: LucideIcon;
	refreshInterval?: number;
	height?: number;
	formatter?: (value: number) => string;
}

interface ChartData {
	data: Record<string, any>[];
}

export function ChartWidget({
	title,
	description,
	endpoint,
	chartType,
	dataKeys,
	xAxisKey,
	icon: Icon,
	refreshInterval = 60000, // 60 seconds default
	height = 300,
	formatter = (val) => val.toString(),
}: ChartWidgetProps) {
	const [chartData, setChartData] = useState<Record<string, any>[] | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		try {
			const response = await fetch(endpoint);
			if (!response.ok) throw new Error("Failed to fetch chart data");
			const result: ChartData = await response.json();
			setChartData(result.data);
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			console.error("[v0] ChartWidget fetch error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();

		if (refreshInterval > 0) {
			const interval = setInterval(fetchData, refreshInterval);
			return () => clearInterval(interval);
		}
	}, [endpoint, refreshInterval]);

	const ChartComponent = chartType === "line" ? LineChart : BarChart;
	const DataComponent: typeof Line | typeof Bar =
		chartType === "line" ? Line : Bar;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							{Icon && <Icon className="h-5 w-5" />}
							{title}
						</CardTitle>
						{description && (
							<CardDescription className="mt-1">
								{description}
							</CardDescription>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="w-full" style={{ height }} />
				) : error ? (
					<div
						className="flex items-center justify-center"
						style={{ height }}
					>
						<div className="text-center space-y-2">
							<div className="text-sm text-destructive">
								Failed to load chart
							</div>
							<div className="text-xs text-muted-foreground">
								{error}
							</div>
						</div>
					</div>
				) : chartData && chartData.length > 0 ? (
					<ResponsiveContainer width="100%" height={height}>
						<ChartComponent data={chartData}>
							<CartesianGrid
								strokeDasharray="3 3"
								className="stroke-muted"
							/>
							<XAxis dataKey={xAxisKey} className="text-xs" />
							<YAxis
								className="text-xs"
								tickFormatter={formatter}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									border: "1px solid hsl(var(--border))",
									borderRadius: "var(--radius)",
								}}
								formatter={formatter}
							/>
							<Legend />
							{dataKeys.map((dataKey) =>
								chartType === "line" ? (
									<Line
										key={dataKey.key}
										type={"monotone"}
										dataKey={dataKey.key}
										name={dataKey.label}
										stroke={dataKey.color}
										fill={dataKey.color}
										strokeWidth={2}
									/>
								) : (
									<Bar
										key={dataKey.key}
										type={undefined}
										dataKey={dataKey.key}
										name={dataKey.label}
										stroke={dataKey.color}
										fill={dataKey.color}
										strokeWidth={2}
									/>
								)
							)}
						</ChartComponent>
					</ResponsiveContainer>
				) : (
					<div
						className="flex items-center justify-center"
						style={{ height }}
					>
						<div className="text-sm text-muted-foreground">
							No data available
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
