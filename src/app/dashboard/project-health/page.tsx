"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	TrendingUp,
	AlertCircle,
	CheckCircle2,
	Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { useProjectStore } from "@/zustand/providers/project-store-provider";

/**
 * Project Health Detail Page
 * Comprehensive view of task management, velocity, and project status
 */
export default function TasksPage() {
	const { data, loading, error, range, fetchData } = useProjectStore((s) => ({
		data: s.data,
		loading: s.loading,
		error: s.error,
		range: s.range,
		fetchData: s.fetchData,
	}));

	useEffect(() => {
		fetchData(range);
	}, [range, fetchData]);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
					<p className="text-muted-foreground">
						Loading project health...
					</p>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="mb-4 text-lg font-semibold text-destructive">
						{error || "Failed to load project data"}
					</p>
					<Link href="/dashboard">
						<Button>Back to Dashboard</Button>
					</Link>
				</div>
			</div>
		);
	}

	const velocityData = data.velocity.map((v, i) => ({
		name: `W${i + 1}`,
		value: v,
	}));

	const taskStatusData = [
		{ name: "Open", value: data.openTasks, fill: "var(--chart-1)" },
		{ name: "Overdue", value: data.overdueTasks, fill: "var(--chart-2)" },
		{
			name: "In Progress",
			value: Math.max(0, data.openTasks - data.overdueTasks),
			fill: "var(--chart-3)",
		},
	];

	const completionRate =
		data.openTasks > 0
			? Math.round(
					((data.openTasks - data.overdueTasks) / data.openTasks) *
						100
				)
			: 100;

	const avgVelocity =
		data.velocity.length > 0
			? Math.round(
					data.velocity.reduce((a, b) => a + b, 0) /
						data.velocity.length
				)
			: 0;

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header with Back Button */}
				<div className="mb-8 flex items-center gap-4">
					<Link href="/dashboard">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold text-foreground">
							Project Health
						</h1>
						<p className="mt-1 text-muted-foreground">
							Task management & velocity tracking
						</p>
					</div>
				</div>

				{/* Key Metrics Grid */}
				<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<TrendingUp className="h-4 w-4 text-chart-1" />
								Open Tasks
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{data.openTasks}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Active work items
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<AlertCircle className="h-4 w-4 text-destructive" />
								Overdue Tasks
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold text-destructive">
								{data.overdueTasks}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Require attention
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<CheckCircle2 className="h-4 w-4 text-green-500" />
								Completion Rate
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{completionRate}%
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								On-time delivery
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<Clock className="h-4 w-4 text-chart-4" />
								Avg Velocity
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">{avgVelocity}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Tasks per week
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Charts Grid */}
				<div className="mb-8 grid gap-6 lg:grid-cols-2">
					{/* Velocity Trend */}
					<Card>
						<CardHeader>
							<CardTitle>Velocity Trend</CardTitle>
							<CardDescription>
								Tasks completed per week over the last 12 weeks
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80 w-full">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={velocityData}>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="var(--border)"
										/>
										<XAxis
											dataKey="name"
											stroke="var(--muted-foreground)"
										/>
										<YAxis stroke="var(--muted-foreground)" />
										<Tooltip
											contentStyle={{
												backgroundColor: "var(--card)",
												border: "1px solid var(--border)",
												borderRadius: "var(--radius)",
											}}
											formatter={(value) =>
												`${value} tasks`
											}
										/>
										<Line
											type="monotone"
											dataKey="value"
											stroke="var(--chart-1)"
											strokeWidth={2}
											dot={{ fill: "var(--chart-1)" }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					{/* Task Status Distribution */}
					<Card>
						<CardHeader>
							<CardTitle>Task Status Distribution</CardTitle>
							<CardDescription>
								Current breakdown of task statuses
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80 w-full">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={taskStatusData}>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="var(--border)"
										/>
										<XAxis
											dataKey="name"
											stroke="var(--muted-foreground)"
										/>
										<YAxis stroke="var(--muted-foreground)" />
										<Tooltip
											contentStyle={{
												backgroundColor: "var(--card)",
												border: "1px solid var(--border)",
												borderRadius: "var(--radius)",
											}}
											formatter={(value) =>
												`${value} tasks`
											}
										/>
										<Bar
											dataKey="value"
											fill="var(--chart-1)"
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Top Priorities */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Top Priorities</CardTitle>
						<CardDescription>
							High-priority tasks requiring immediate attention
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{data.topPriorities.map((task) => (
								<div
									key={task.id}
									className="flex items-center justify-between rounded-lg border border-border p-4"
								>
									<div className="flex-1">
										<p className="font-medium text-foreground">
											{task.title}
										</p>
										<p className="text-sm text-muted-foreground">
											Due:{" "}
											{new Date(
												task.dueDate
											).toLocaleDateString()}
										</p>
									</div>
									<span
										className={`rounded-full px-3 py-1 text-xs font-semibold ${
											task.priority === "urgent"
												? "bg-red-100 text-red-700"
												: task.priority === "high"
													? "bg-orange-100 text-orange-700"
													: task.priority === "medium"
														? "bg-yellow-100 text-yellow-700"
														: "bg-blue-100 text-blue-700"
										}`}
									>
										{task.priority.toUpperCase()}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Insights */}
				<Card>
					<CardHeader>
						<CardTitle>Key Insights</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
							<p className="font-medium">Analysis:</p>
							<p className="mt-2">{data.insight}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
