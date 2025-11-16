"use client";

import { useAnalyticsStore } from "@/zustand/providers/analytics-store-provider";
import { AnalyticsData } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

export function AnalyticsClientPage({
	initialMetrics,
}: {
	initialMetrics: AnalyticsData[];
}) {
	const {
		metrics,
		setMetrics,
		activeTab,
		setActiveTab,
		filters,
		setFilters,
		selectedMetric,
		setSelectedMetric,
		anomalies,
		addAnomaly,
		acknowledgeAnomaly,
	} = useAnalyticsStore((state) => state);

	// Hydrate initial data
	if (metrics.length === 0 && initialMetrics.length > 0) {
		setMetrics(initialMetrics);
	}

	// Placeholder for real-time anomalies (simulate or use websockets in production)
	// For MVP, anomalies are client-side state; in real, fetch from server

	return (
		<div className="space-y-6">
			{/* Key Metrics Dashboard */}
			<section className="overflow-x-auto pb-4">
				<div className="flex space-x-4 min-w-max">
					{metrics.map((metric) => (
						<Card
							key={metric.id}
							className={cn(
								"w-[200px] cursor-pointer hover:shadow-md transition-shadow",
								selectedMetric?.id === metric.id &&
									"border-primary"
							)}
							onClick={() => setSelectedMetric(metric)}
						>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">
									{metric.metricName}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{metric.metricValue}
								</div>
								<p className="text-xs text-muted-foreground">
									↑ 5.2% WoW
								</p>{" "}
								{/* Placeholder trend */}
							</CardContent>
						</Card>
					))}
					{!metrics.length &&
						Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="w-[200px] h-[150px]" />
						))}
				</div>
			</section>

			{/* Filters */}
			<div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
				<Select
					value={filters.timeRange}
					onValueChange={(v) => setFilters({ timeRange: v })}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Time Range" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="24h">24 Hours</SelectItem>
						<SelectItem value="7d">7 Days</SelectItem>
						<SelectItem value="30d">30 Days</SelectItem>
					</SelectContent>
				</Select>
				<Button
					variant="outline"
					onClick={() =>
						setFilters({ comparePeriod: !filters.comparePeriod })
					}
				>
					Compare Previous {filters.comparePeriod ? "Off" : "On"}
				</Button>
				<Button>Export Data</Button>
			</div>

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-4"
			>
				<TabsList className="overflow-x-auto">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="funnels">Funnels</TabsTrigger>
					<TabsTrigger value="events">Events</TabsTrigger>
					<TabsTrigger value="cohorts">User Cohorts</TabsTrigger>
					<TabsTrigger value="anomalies">
						Anomalies & Alerts
					</TabsTrigger>
				</TabsList>
				<TabsContent value="overview" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Overview Dashboard</CardTitle>
						</CardHeader>
						<CardContent>
							{/* Implement drag-and-drop charts; for MVP, placeholder grids */}
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="funnels" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Funnels</CardTitle>
						</CardHeader>
						<CardContent>{/* Funnel visualizations */}</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="events" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Events</CardTitle>
						</CardHeader>
						<CardContent>
							{/* Event lists and timelines */}
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="cohorts" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>User Cohorts</CardTitle>
						</CardHeader>
						<CardContent>{/* Retention curves */}</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="anomalies" className="space-y-4">
					{anomalies.map((anomaly) => (
						<Alert key={anomaly.id} variant="destructive">
							<AlertTitle>{anomaly.title}</AlertTitle>
							<AlertDescription>
								{anomaly.description}
							</AlertDescription>
							<Button
								variant="ghost"
								onClick={() => acknowledgeAnomaly(anomaly.id)}
							>
								Acknowledge
							</Button>
						</Alert>
					))}
				</TabsContent>
			</Tabs>

			{/* Metric Detail View */}
			{selectedMetric && (
				<Card className="mt-6">
					<CardHeader>
						<CardTitle>
							{selectedMetric.metricName} Details
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="text-3xl font-bold">
							{selectedMetric.metricValue}{" "}
							{selectedMetric.metricUnit}
						</div>
						{/* Chart placeholder */}
						<div className="h-[300px] bg-muted rounded-md flex items-center justify-center">
							Main Chart
						</div>
						{/* Breakdowns */}
						<div className="space-y-2">
							<h3 className="font-medium">Breakdowns</h3>
							{/* Table or sub-charts */}
						</div>
						{/* Related Insights */}
						<div className="space-y-2">
							<h3 className="font-medium">Insights</h3>
							<ul className="list-disc pl-4 text-sm text-muted-foreground">
								<li>Placeholder insight 1</li>
							</ul>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
