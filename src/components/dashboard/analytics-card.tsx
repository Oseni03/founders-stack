"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { TrendingUp, MapPin } from "lucide-react";
import Link from "next/link";
import type { Metrics } from "@/lib/schemas";

interface AnalyticsCardProps {
	data: Metrics["analytics"];
}

export function AnalyticsCard({ data }: AnalyticsCardProps) {
	return (
		<Link href="/dashboard/analytics">
			<Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Analytics
					</CardTitle>
					<CardDescription>User engagement & traffic</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Key Metrics - User Stats */}
					<div className="grid grid-cols-3 gap-3">
						<div className="rounded-lg bg-muted p-3">
							<p className="text-xs font-medium text-muted-foreground">
								Page Views
							</p>
							<p className="text-xl font-bold text-blue-600">
								{data.userMetrics.pageViews.toLocaleString()}
							</p>
						</div>
						<div className="rounded-lg bg-muted p-3">
							<p className="text-xs font-medium text-muted-foreground">
								Visitors
							</p>
							<p className="text-xl font-bold text-green-600">
								{data.userMetrics.uniqueVisitors.toLocaleString()}
							</p>
						</div>
						<div className="rounded-lg bg-muted p-3">
							<p className="text-xs font-medium text-muted-foreground">
								Avg Duration
							</p>
							<p className="text-xl font-bold text-purple-600">
								{data.userMetrics.avgSessionDuration.toFixed(1)}
								m
							</p>
						</div>
					</div>

					{/* Page View Trends */}
					<div>
						<p className="mb-2 text-sm font-semibold text-foreground">
							Page View Trends
						</p>
						<div className="h-32 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={data.pageViewTrends}>
									<defs>
										<linearGradient
											id="colorPageViews"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--chart-1)"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="var(--chart-1)"
												stopOpacity={0}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="var(--border)"
									/>
									<XAxis
										dataKey="timestamp"
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
										formatter={(value) => `${value} views`}
									/>
									<Area
										type="monotone"
										dataKey="value"
										stroke="var(--chart-1)"
										fillOpacity={1}
										fill="url(#colorPageViews)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>
					</div>

					{/* Error Metrics */}
					<div className="rounded-lg border border-red-200 bg-red-50 p-3">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-medium text-red-700">
									Error Rate
								</p>
								<p className="text-lg font-bold text-red-900">
									{data.errorMetrics.errorRate}%
								</p>
							</div>
							<div className="text-right">
								<p className="text-xs font-medium text-red-700">
									Errors
								</p>
								<p className="text-lg font-bold text-red-900">
									{data.errorMetrics.errorCount}
								</p>
							</div>
						</div>
					</div>

					{/* Top Geo Locations */}
					<div>
						<p className="mb-2 text-sm font-semibold text-foreground">
							Top Locations
						</p>
						<div className="space-y-2">
							{data.geoMetrics.map((geo) => (
								<div
									key={geo.location}
									className="flex items-center justify-between rounded-lg bg-muted p-2"
								>
									<div className="flex items-center gap-2">
										<MapPin className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-medium">
											{geo.location}
										</span>
									</div>
									<span className="text-sm font-semibold text-foreground">
										{geo.pageViews.toLocaleString()}
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
