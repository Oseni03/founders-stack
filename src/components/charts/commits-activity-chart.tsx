"use client";

import { useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GitCommit } from "lucide-react";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, CartesianGrid } from "recharts";

export interface CommitActivityChartProps {
	commits: { repositoryId: string; committedAt: Date }[];
	selectedRepoId: string;
	isLoading: boolean;
	error: string | null;
}

const chartConfig: ChartConfig = {
	commits: {
		label: "Commits",
		color: "hsl(var(--primary))",
	},
} satisfies ChartConfig;

export function CommitActivityChart({
	commits,
	selectedRepoId,
	isLoading,
	error,
}: CommitActivityChartProps) {
	const [activeChart, setActiveChart] = useState<"commits">("commits");

	// Aggregate commits by date
	const commitChartData = useMemo(() => {
		if (!commits || !selectedRepoId) return null;
		const filteredCommits = commits.filter(
			(c) => c.repositoryId === selectedRepoId
		);
		const dateMap = filteredCommits.reduce(
			(acc, commit) => {
				const date = new Date(commit.committedAt)
					.toISOString()
					.split("T")[0];
				acc[date] = (acc[date] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);
		return Object.entries(dateMap).map(([date, commits]) => ({
			date,
			commits,
		}));
	}, [commits, selectedRepoId]);

	// Total commits for toggle button
	const total = useMemo(
		() => ({
			commits:
				commitChartData?.reduce((acc, curr) => acc + curr.commits, 0) ||
				0,
		}),
		[commitChartData]
	);

	return (
		<Card className="py-4 sm:py-0">
			<CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
				<div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
					<CardTitle className="flex items-center gap-2">
						<GitCommit className="h-5 w-5" />
						Commit Activity
					</CardTitle>
					<CardDescription className="mt-1">
						Daily commits across selected repository
					</CardDescription>
				</div>
				<div className="flex">
					<button
						data-active={activeChart === "commits"}
						className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
						onClick={() => setActiveChart("commits")}
					>
						<span className="text-muted-foreground text-xs">
							{chartConfig.commits.label}
						</span>
						<span className="text-lg leading-none font-bold sm:text-3xl">
							{total.commits.toLocaleString()}
						</span>
					</button>
				</div>
			</CardHeader>
			<CardContent className="px-2 sm:p-6">
				{isLoading ? (
					<Skeleton className="w-full" style={{ height: 250 }} />
				) : error ? (
					<div
						className="flex items-center justify-center"
						style={{ height: 250 }}
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
				) : commitChartData && commitChartData.length > 0 ? (
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-[250px] w-full"
					>
						<LineChart
							accessibilityLayer
							data={commitChartData}
							margin={{ left: 12, right: 12 }}
						>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={32}
								tickFormatter={(value) => {
									const date = new Date(value);
									return date.toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									});
								}}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										className="w-[150px]"
										nameKey="Commits"
										labelFormatter={(value) => {
											return new Date(
												value
											).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: "numeric",
											});
										}}
									/>
								}
							/>
							<Line
								dataKey={activeChart}
								type="monotone"
								stroke={`var(--color-${activeChart})`}
								strokeWidth={2}
								dot={false}
							/>
						</LineChart>
					</ChartContainer>
				) : (
					<div
						className="flex items-center justify-center"
						style={{ height: 250 }}
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
