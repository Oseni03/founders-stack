"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { GitBranch, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Metrics } from "@/lib/schemas";

interface CodeCICardProps {
	productId: string;
	data: Metrics["code"];
}

export function CodeCICard({ productId, data }: CodeCICardProps) {
	const activityData = [
		{ name: "Commits", value: data.commits },
		{ name: "PRs", value: data.prs * 4 },
	];

	const statusColor =
		data.buildStatus === "success"
			? "text-green-600"
			: data.buildStatus === "failed"
				? "text-red-600"
				: "text-yellow-600";
	const statusIcon =
		data.buildStatus === "success" ? (
			<CheckCircle className="h-5 w-5" />
		) : (
			<AlertCircle className="h-5 w-5" />
		);

	return (
		<Link href={`/products/${productId}/version-control`}>
			<Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<GitBranch className="h-5 w-5" />
						Version Control
					</CardTitle>
					<CardDescription>
						Dev pipeline & deployments
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Key Metric - Build Status */}
					<div className="rounded-lg bg-muted p-4">
						<p className="text-sm font-medium text-muted-foreground">
							Build Status
						</p>
						<div className="mt-2 flex items-center gap-2">
							<span className={statusColor}>{statusIcon}</span>
							<span className="text-lg font-bold capitalize">
								{data.buildStatus}
							</span>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Success Rate:{" "}
							<span className="font-semibold text-foreground">
								{data.buildSuccessRate}%
							</span>
						</p>
					</div>

					{/* Activity Chart */}
					<div className="h-40 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={activityData}>
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
								/>
								<Bar
									dataKey="value"
									fill="var(--chart-1)"
									radius={[8, 8, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Recent Deploys */}
					<div className="space-y-2">
						<p className="text-sm font-semibold text-foreground">
							Recent Deploys
						</p>
						<div className="space-y-1">
							{data.recentDeploys.slice(0, 3).map((deploy) => (
								<div
									key={deploy.id}
									className="flex items-center justify-between rounded bg-muted p-2 text-sm"
								>
									<div>
										<p className="font-medium capitalize">
											{deploy.environment}
										</p>
										<p className="text-xs text-muted-foreground">
											{new Date(
												deploy.timestamp
											).toLocaleTimeString()}
										</p>
									</div>
									<span
										className={`rounded px-2 py-1 text-xs font-medium ${
											deploy.status === "success"
												? "bg-green-100 text-green-700"
												: "bg-red-100 text-red-700"
										}`}
									>
										{deploy.status}
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
