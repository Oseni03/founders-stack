"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, AlertTriangle } from "lucide-react";
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";
import { useAnalyticsStore } from "@/zustand/providers/analytics-store-provider";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AnalyticsPage() {
	const {
		timeRange,
		userMetrics,
		errorMetrics,
		geoMetrics,
		pageViewTrends,
		sessionDurationTrends,
		errorTrends,
		isLoading,
		error,
		setTimeRange,
	} = useAnalyticsStore((state) => state);

	useEffect(() => {
		if (error) {
			toast.error(error);
		}
	}, [error]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Analytics
					</h1>
					<p className="text-muted-foreground mt-1">
						Monitor user activity, errors, and geolocation
					</p>
				</div>
				<Select value={timeRange} onValueChange={setTimeRange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select time range" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="24h">Last 24 hours</SelectItem>
						<SelectItem value="7d">Last 7 days</SelectItem>
						<SelectItem value="30d">Last 30 days</SelectItem>
						<SelectItem value="90d">Last 90 days</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-3">
				{isLoading ? (
					<>
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
					</>
				) : (
					<>
						{/* Page Views */}
						{userMetrics && (
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Page Views
									</CardTitle>
									<Users className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{userMetrics.pageViews.toLocaleString()}
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										{userMetrics.uniqueVisitors} unique
										visitors
									</p>
								</CardContent>
							</Card>
						)}

						{/* Session Duration */}
						{userMetrics && (
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Avg Session Duration
									</CardTitle>
									<Users className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{userMetrics.avgSessionDuration.toFixed(
											1
										)}
										s
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										Average time per session
									</p>
								</CardContent>
							</Card>
						)}

						{/* Error Count */}
						{errorMetrics && (
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Errors
									</CardTitle>
									<AlertTriangle className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{errorMetrics.errorCount}
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										{errorMetrics.errorRate.toFixed(2)}%
										error rate
									</p>
								</CardContent>
							</Card>
						)}
					</>
				)}
			</div>

			{/* Charts */}
			<Tabs defaultValue="users" className="space-y-4">
				<TabsList>
					<TabsTrigger value="users">User Analytics</TabsTrigger>
					<TabsTrigger value="errors">Error Trends</TabsTrigger>
					<TabsTrigger value="geolocation">Geolocation</TabsTrigger>
				</TabsList>

				<TabsContent value="users" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Page Views Over Time</CardTitle>
							<CardDescription>
								Total page views by date
							</CardDescription>
						</CardHeader>
						<CardContent className="pl-2">
							{isLoading ? (
								<Skeleton className="h-[300px] w-full" />
							) : (
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={pageViewTrends}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="timestamp" />
										<YAxis />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="value"
											stroke="#3b82f6"
											fill="#3b82f6"
											name="Page Views"
										/>
									</AreaChart>
								</ResponsiveContainer>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Session Duration Over Time</CardTitle>
							<CardDescription>
								Average session duration by date
							</CardDescription>
						</CardHeader>
						<CardContent className="pl-2">
							{isLoading ? (
								<Skeleton className="h-[300px] w-full" />
							) : (
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={sessionDurationTrends}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="timestamp" />
										<YAxis />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="value"
											stroke="#3b82f6"
											fill="#3b82f6"
											name="Session Duration (s)"
										/>
									</AreaChart>
								</ResponsiveContainer>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="errors" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Error Count Over Time</CardTitle>
							<CardDescription>
								Number of errors by date
							</CardDescription>
						</CardHeader>
						<CardContent className="pl-2">
							{isLoading ? (
								<Skeleton className="h-[300px] w-full" />
							) : (
								<ResponsiveContainer width="100%" height={300}>
									<AreaChart data={errorTrends}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="timestamp" />
										<YAxis />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="value"
											stroke="#ef4444"
											fill="#ef4444"
											name="Error Count"
										/>
									</AreaChart>
								</ResponsiveContainer>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="geolocation" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Page Views by Location</CardTitle>
							<CardDescription>
								Distribution of page views by location
							</CardDescription>
						</CardHeader>
						<CardContent className="pl-2">
							{isLoading ? (
								<Skeleton className="h-[300px] w-full" />
							) : (
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={geoMetrics}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="location" />
										<YAxis />
										<Tooltip />
										<Legend />
										<Bar
											dataKey="pageViews"
											fill="#3b82f6"
											name="Page Views"
										/>
									</BarChart>
								</ResponsiveContainer>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
