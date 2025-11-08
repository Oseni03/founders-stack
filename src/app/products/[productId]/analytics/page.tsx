"use client";

import { useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	Eye,
	Smartphone,
	Globe,
	Globe2,
	MessageSquare,
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
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { useAnalyticsStore } from "@/zustand/providers/analytics-store-provider";
import { AnalyticsPageLoading } from "@/components/analytics/analytics-loading";
import { AnalyticsNoDataState } from "@/components/analytics/analytics-no-data";
import { useParams } from "next/navigation";

export default function AnalyticsPage() {
	const { productId } = useParams();
	const data = useAnalyticsStore((state) => state.data);
	const loading = useAnalyticsStore((state) => state.loading);
	const timeRange = useAnalyticsStore((state) => state.timeRange);
	const setData = useAnalyticsStore((state) => state.setData);
	const setLoading = useAnalyticsStore((state) => state.setLoading);
	const setTimeRange = useAnalyticsStore((state) => state.setTimeRange);

	const fetchMetrics = useCallback(async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/products/${productId}/analytics?range=${timeRange}`
			);

			if (!response.ok) throw new Error("Failed to fetch metrics");

			const fetchedData = await response.json();
			setData(fetchedData);
		} catch (err) {
			console.error("[Analytics] Fetch error:", err);
		} finally {
			setLoading(false);
		}
	}, [timeRange, setData, setLoading]);

	useEffect(() => {
		fetchMetrics();
	}, [fetchMetrics]);

	const COLORS = useMemo(
		() => [
			"var(--chart-1)",
			"var(--chart-2)",
			"var(--chart-3)",
			"var(--chart-4)",
			"var(--chart-5)",
		],
		[]
	);

	if (loading) {
		return <AnalyticsPageLoading />;
	}

	if (!data || !data.summary) {
		return <AnalyticsNoDataState />;
	}

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header with Back Button */}
				<div className="mb-8 flex items-center gap-4">
					<Link href="/products">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div className="flex-1">
						<h1 className="text-3xl font-bold text-foreground">
							Analytics
						</h1>
						<p className="mt-1 text-muted-foreground">
							Event tracking and user behavior analysis
						</p>
					</div>
					<div className="flex gap-2">
						<Button
							variant={timeRange === "7d" ? "default" : "outline"}
							size="sm"
							onClick={() => setTimeRange("7d")}
						>
							7d
						</Button>
						<Button
							variant={
								timeRange === "30d" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setTimeRange("30d")}
						>
							30d
						</Button>
						<Button
							variant={
								timeRange === "90d" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setTimeRange("90d")}
						>
							90d
						</Button>
					</div>
				</div>

				<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<Eye className="h-4 w-4 text-chart-1" />
								Total Events
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{data.summary.totalEvents.toLocaleString()}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								All tracked events
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<Eye className="h-4 w-4 text-chart-2" />
								Page Views
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{data.summary.totalPageviews.toLocaleString()}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								$pageview events
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<Globe className="h-4 w-4 text-chart-3" />
								Unique Visitors
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{data.summary.uniqueVisitors.toLocaleString()}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Unique users
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<MessageSquare className="h-4 w-4 text-chart-4" />
								Avg Duration
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{data.summary.avgSessionDuration.toFixed(1)}s
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Average session
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="mb-8 grid gap-6 lg:grid-cols-2">
					{/* Event Types Distribution */}
					<Card>
						<CardHeader>
							<CardTitle>Event Types Distribution</CardTitle>
							<CardDescription>
								Breakdown of tracked event types
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80 w-full">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={data.eventTypes}
											dataKey="count"
											nameKey="name"
											cx="50%"
											cy="50%"
											outerRadius={100}
											label={({ name, percentage }) =>
												`${name} ${percentage}%`
											}
										>
											{data.eventTypes.map((_, index) => (
												<Cell
													key={`cell-${index}`}
													fill={
														COLORS[
															index %
																COLORS.length
														]
													}
												/>
											))}
										</Pie>
										<Tooltip
											formatter={(value) =>
												`${value} events`
											}
										/>
									</PieChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					{/* Device Types Distribution */}
					<Card>
						<CardHeader>
							<CardTitle>Device Types</CardTitle>
							<CardDescription>
								Traffic by device type
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{data.deviceTypes.map((device, index) => (
									<div
										key={index}
										className="flex items-center justify-between rounded-lg border border-border p-3"
									>
										<div className="flex items-center gap-2">
											<Smartphone className="h-4 w-4 text-muted-foreground" />
											<span className="font-medium">
												{device.name}
											</span>
										</div>
										<div className="text-right">
											<p className="font-semibold">
												{device.count.toLocaleString()}
											</p>
											<p className="text-xs text-muted-foreground">
												{device.percentage}%
											</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Event Trends */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Event Trends</CardTitle>
						<CardDescription>
							Events and page views over time
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="h-80 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={data.eventTrends}>
									<CartesianGrid
										strokeDasharray="3 3"
										stroke="var(--border)"
									/>
									<XAxis
										dataKey="timestamp"
										stroke="var(--muted-foreground)"
										style={{ fontSize: "12px" }}
									/>
									<YAxis stroke="var(--muted-foreground)" />
									<Tooltip
										contentStyle={{
											backgroundColor: "var(--card)",
											border: "1px solid var(--border)",
											borderRadius: "var(--radius)",
										}}
									/>
									<Line
										type="monotone"
										dataKey="pageviews"
										stroke="var(--chart-1)"
										strokeWidth={2}
										dot={false}
										name="Page Views"
									/>
									<Line
										type="monotone"
										dataKey="events"
										stroke="var(--chart-2)"
										strokeWidth={2}
										dot={false}
										name="Events"
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</CardContent>
				</Card>

				<div className="mb-8 grid gap-6 lg:grid-cols-2">
					{/* Top Pages */}
					<Card>
						<CardHeader>
							<CardTitle>Top Pages</CardTitle>
							<CardDescription>
								Most visited pages
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{data.topPages.map((page, index) => (
									<div
										key={index}
										className="flex items-center justify-between rounded-lg border border-border p-3"
									>
										<div className="flex-1">
											<p className="font-medium text-foreground">
												{page.pathname}
											</p>
											<p className="text-xs text-muted-foreground">
												Avg duration: {page.avgDuration}
												s
											</p>
										</div>
										<div className="text-right">
											<p className="font-semibold">
												{page.pageviews.toLocaleString()}
											</p>
											<p className="text-xs text-muted-foreground">
												views
											</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Top Referrers */}
					<Card>
						<CardHeader>
							<CardTitle>Top Referrers</CardTitle>
							<CardDescription>Traffic sources</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{data.topReferrers.map((referrer, index) => (
									<div
										key={index}
										className="flex items-center justify-between rounded-lg border border-border p-3"
									>
										<div className="flex-1">
											<p className="font-medium text-foreground">
												{referrer.referringDomain}
											</p>
										</div>
										<div className="text-right">
											<p className="font-semibold">
												{referrer.count.toLocaleString()}
											</p>
											<p className="text-xs text-muted-foreground">
												{referrer.percentage}%
											</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Geographic Distribution */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Geographic Distribution</CardTitle>
						<CardDescription>Visitors by country</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{data.geoMetrics.map((geo, index) => (
								<div
									key={index}
									className="flex items-center justify-between rounded-lg border border-border p-3"
								>
									<div className="flex items-center gap-2">
										<Globe2 className="h-4 w-4 text-muted-foreground" />
										<div>
											<p className="font-medium text-foreground">
												{geo.geoipCountryName}
											</p>
											<p className="text-xs text-muted-foreground">
												{geo.geoipCountryCode}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="font-semibold">
											{geo.count.toLocaleString()}
										</p>
										<p className="text-xs text-muted-foreground">
											{geo.percentage}%
										</p>
									</div>
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
