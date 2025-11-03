"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Metrics } from "@/lib/schemas";

interface ProjectHealthCardProps {
	data: Metrics["project"];
}

export function ProjectHealthCard({ data }: ProjectHealthCardProps) {
	const velocityData = data.velocity.map((v, i) => ({
		name: `W${i + 1}`,
		value: v,
	}));

	const gaugeColor =
		data.openTasks > 50
			? "text-red-500"
			: data.openTasks > 30
				? "text-yellow-500"
				: "text-green-500";

	return (
		<Link href="/dashboard/project-management">
			<Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Project Health
					</CardTitle>
					<CardDescription>
						Task management & velocity
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Key Metric - Gauge */}
					<div className="rounded-lg bg-muted p-4">
						<p className="text-sm font-medium text-muted-foreground">
							Open Tasks
						</p>
						<p className={`text-3xl font-bold ${gaugeColor}`}>
							{data.openTasks}
						</p>
						{data.overdueTasks > 0 && (
							<p className="mt-2 flex items-center gap-1 text-sm text-orange-600">
								<AlertCircle className="h-4 w-4" />
								{data.overdueTasks} overdue
							</p>
						)}
					</div>

					{/* Velocity Chart */}
					<div className="h-40 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={velocityData}>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="var(--border)"
								/>
								<XAxis
									dataKey="name"
									stroke="var(--muted-foreground)"
									style={{ fontSize: "12px" }}
								/>
								<YAxis
									stroke="var(--muted-foreground)"
									style={{ fontSize: "12px" }}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "var(--card)",
										border: "1px solid var(--border)",
										borderRadius: "var(--radius)",
									}}
									formatter={(value) => `${value} tasks`}
								/>
								<Line
									type="monotone"
									dataKey="value"
									stroke="var(--chart-1)"
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* Top Priorities Table */}
					<div className="space-y-2">
						<p className="text-sm font-semibold text-foreground">
							Top Priorities
						</p>
						<div className="space-y-1">
							{data.topPriorities.slice(0, 3).map((task) => (
								<div
									key={task.id}
									className="flex items-center justify-between rounded bg-muted p-2 text-sm"
								>
									<span className="truncate">
										{task.title}
									</span>
									<span
										className={`rounded px-2 py-1 text-xs font-medium ${
											task.priority === "urgent"
												? "bg-red-100 text-red-700"
												: task.priority === "high"
													? "bg-orange-100 text-orange-700"
													: task.priority === "medium"
														? "bg-yellow-100 text-yellow-700"
														: "bg-blue-100 text-blue-700"
										}`}
									>
										{task.priority}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Insight */}
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
						<p className="font-medium">Insight:</p>
						<p>{data.insight}</p>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
