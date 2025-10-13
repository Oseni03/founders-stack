"use client";

import { useState, useEffect } from "react";
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
import { AnalyticsEvent } from "@prisma/client";

interface UserMetrics {
	pageViews: number;
	avgSessionDuration: number;
	uniqueVisitors: number;
}

interface ErrorMetrics {
	errorCount: number;
	errorRate: number;
}

interface GeoMetrics {
	location: string;
	pageViews: number;
}

interface ChartData {
	timestamp: string;
	value: number;
}

export default function AnalyticsPage() {
	const [timeRange, setTimeRange] = useState("7d");
	const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
	const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics | null>(null);
	const [geoMetrics, setGeoMetrics] = useState<GeoMetrics[]>([]);
	const [pageViewTrends, setPageViewTrends] = useState<ChartData[]>([]);
	const [sessionDurationTrends, setSessionDurationTrends] = useState<
		ChartData[]
	>([]);
	const [errorTrends, setErrorTrends] = useState<ChartData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const response = await fetch(
					`/api/analytics?range=${timeRange}`
				);
				const events: AnalyticsEvent[] = await response.json();

				// Compute metrics from events
				const pageViewEvents = events.filter(
					(e) => e.eventType === "$pageview"
				);
				const pageLeaveEvents = events.filter(
					(e) => e.eventType === "$pageleave"
				);
				const errorEvents = events.filter(
					(e) => e.eventType === "$exception"
				);

				// User Metrics
				const pageViews = pageViewEvents.length;
				const avgSessionDuration =
					pageLeaveEvents.length > 0
						? pageLeaveEvents.reduce(
								(sum, e) => sum + (e.duration || 0),
								0
							) / pageLeaveEvents.length
						: 0;
				const uniqueVisitors = new Set(events.map((e) => e.externalId))
					.size;

				setUserMetrics({
					pageViews,
					avgSessionDuration,
					uniqueVisitors,
				});

				// Error Metrics
				const errorCount = errorEvents.length;
				const errorRate =
					pageViews > 0 ? (errorCount / pageViews) * 100 : 0;
				setErrorMetrics({ errorCount, errorRate });

				// Geo Metrics
				const geoMap = new Map<string, number>();
				for (const e of pageViewEvents) {
					const location = `${e.geoipCityName || "Unknown"}, ${e.geoipCountryName || "Unknown"}`;
					geoMap.set(location, (geoMap.get(location) || 0) + 1);
				}
				const geoData = Array.from(geoMap.entries())
					.map(([location, pageViews]) => ({ location, pageViews }))
					.sort((a, b) => b.pageViews - a.pageViews);
				setGeoMetrics(geoData);

				// Helper to get date key
				const getDateKey = (timestamp: Date): string => {
					return timestamp.toISOString().split("T")[0];
				};

				// Page View Trends
				const pvMap = new Map<string, number>();
				for (const e of pageViewEvents) {
					const key = getDateKey(e.timestamp);
					pvMap.set(key, (pvMap.get(key) || 0) + 1);
				}
				const pvTrends = Array.from(pvMap.entries())
					.map(([timestamp, value]) => ({ timestamp, value }))
					.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
				setPageViewTrends(pvTrends);

				// Session Duration Trends
				const sdSumMap = new Map<string, number>();
				const sdCountMap = new Map<string, number>();
				for (const e of pageLeaveEvents) {
					const key = getDateKey(e.timestamp);
					sdSumMap.set(
						key,
						(sdSumMap.get(key) || 0) + (e.duration || 0)
					);
					sdCountMap.set(key, (sdCountMap.get(key) || 0) + 1);
				}
				const sdTrends = Array.from(sdSumMap.keys())
					.map((key) => ({
						timestamp: key,
						value:
							sdCountMap.get(key)! > 0
								? sdSumMap.get(key)! / sdCountMap.get(key)!
								: 0,
					}))
					.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
				setSessionDurationTrends(sdTrends);

				// Error Trends
				const errMap = new Map<string, number>();
				for (const e of errorEvents) {
					const key = getDateKey(e.timestamp);
					errMap.set(key, (errMap.get(key) || 0) + 1);
				}
				const errTrends = Array.from(errMap.entries())
					.map(([timestamp, value]) => ({ timestamp, value }))
					.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
				setErrorTrends(errTrends);
			} catch (error) {
				console.error("[v0] Failed to fetch analytics data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [timeRange]);

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
