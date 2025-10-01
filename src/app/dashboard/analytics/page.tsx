"use client";

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	AlertTriangle,
	TrendingUp,
	TrendingDown,
	Users,
	Zap,
	Activity,
	Bell,
} from "lucide-react";
import { ChartWidget } from "@/components/widgets/chart-widget";
import {
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	Legend,
	Scatter,
	ScatterChart,
	ZAxis,
} from "recharts";

interface ErrorMetrics {
	currentRate: number;
	change: number;
	totalErrors: number;
	affectedUsers: number;
}

interface UserMetrics {
	activeUsers: number;
	change: number;
	newUsers: number;
	retention: number;
}

interface PerformanceMetrics {
	avgLoadTime: number;
	change: number;
	p95LoadTime: number;
	apiLatency: number;
}

interface Alert {
	id: string;
	type: "error" | "performance" | "user";
	message: string;
	timestamp: string;
	severity: "critical" | "warning" | "info";
}

interface CorrelationData {
	date: string;
	deploys: number;
	errors: number;
	users: number;
}

export default function AnalyticsPage() {
	const [timeRange, setTimeRange] = useState("7d");
	const [errorMetrics, setErrorMetrics] = useState<ErrorMetrics | null>(null);
	const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
	const [performanceMetrics, setPerformanceMetrics] =
		useState<PerformanceMetrics | null>(null);
	const [alerts, setAlerts] = useState<Alert[]>([]);
	const [correlationData, setCorrelationData] = useState<CorrelationData[]>(
		[]
	);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const [errorRes, userRes, perfRes, alertsRes, correlationRes] =
					await Promise.all([
						fetch(`/api/analytics/errors?range=${timeRange}`),
						fetch(`/api/analytics/users?range=${timeRange}`),
						fetch(`/api/analytics/performance?range=${timeRange}`),
						fetch(`/api/analytics/alerts?range=${timeRange}`),
						fetch(`/api/analytics/correlation?range=${timeRange}`),
					]);

				const [
					errorData,
					userData,
					perfData,
					alertsData,
					correlationData,
				] = await Promise.all([
					errorRes.json(),
					userRes.json(),
					perfRes.json(),
					alertsRes.json(),
					correlationRes.json(),
				]);

				setErrorMetrics(errorData);
				setUserMetrics(userData);
				setPerformanceMetrics(perfData);
				setAlerts(alertsData.alerts);
				setCorrelationData(correlationData.data);
			} catch (error) {
				console.error("[v0] Failed to fetch analytics data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [timeRange]);

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case "critical":
				return "bg-red-500";
			case "warning":
				return "bg-yellow-500";
			case "info":
				return "bg-blue-500";
			default:
				return "bg-gray-500";
		}
	};

	const getAlertIcon = (type: string) => {
		switch (type) {
			case "error":
				return AlertTriangle;
			case "performance":
				return Zap;
			case "user":
				return Users;
			default:
				return Activity;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Analytics
					</h1>
					<p className="text-muted-foreground mt-1">
						Monitor errors, users, and performance metrics
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
						{/* Error Rate */}
						{errorMetrics && (
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Error Rate
									</CardTitle>
									<AlertTriangle className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{errorMetrics.currentRate}%
									</div>
									<div className="flex items-center gap-1 text-xs mt-1">
										{errorMetrics.change > 0 ? (
											<>
												<TrendingUp className="h-3 w-3 text-red-500" />
												<span className="text-red-500">
													+{errorMetrics.change}%
												</span>
											</>
										) : (
											<>
												<TrendingDown className="h-3 w-3 text-green-500" />
												<span className="text-green-500">
													{errorMetrics.change}%
												</span>
											</>
										)}
										<span className="text-muted-foreground">
											vs previous period
										</span>
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										{errorMetrics.totalErrors} errors,{" "}
										{errorMetrics.affectedUsers} users
										affected
									</p>
								</CardContent>
							</Card>
						)}

						{/* Active Users */}
						{userMetrics && (
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Active Users
									</CardTitle>
									<Users className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{userMetrics.activeUsers.toLocaleString()}
									</div>
									<div className="flex items-center gap-1 text-xs mt-1">
										{userMetrics.change > 0 ? (
											<>
												<TrendingUp className="h-3 w-3 text-green-500" />
												<span className="text-green-500">
													+{userMetrics.change}%
												</span>
											</>
										) : (
											<>
												<TrendingDown className="h-3 w-3 text-red-500" />
												<span className="text-red-500">
													{userMetrics.change}%
												</span>
											</>
										)}
										<span className="text-muted-foreground">
											vs previous period
										</span>
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										{userMetrics.newUsers} new,{" "}
										{userMetrics.retention}% retention
									</p>
								</CardContent>
							</Card>
						)}

						{/* Performance */}
						{performanceMetrics && (
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Avg Load Time
									</CardTitle>
									<Zap className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{performanceMetrics.avgLoadTime}ms
									</div>
									<div className="flex items-center gap-1 text-xs mt-1">
										{performanceMetrics.change > 0 ? (
											<>
												<TrendingUp className="h-3 w-3 text-red-500" />
												<span className="text-red-500">
													+{performanceMetrics.change}
													%
												</span>
											</>
										) : (
											<>
												<TrendingDown className="h-3 w-3 text-green-500" />
												<span className="text-green-500">
													{performanceMetrics.change}%
												</span>
											</>
										)}
										<span className="text-muted-foreground">
											vs previous period
										</span>
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										P95: {performanceMetrics.p95LoadTime}ms,
										API: {performanceMetrics.apiLatency}ms
									</p>
								</CardContent>
							</Card>
						)}
					</>
				)}
			</div>

			{/* Time Series Charts */}
			<Tabs defaultValue="errors" className="space-y-4">
				<TabsList>
					<TabsTrigger value="errors">Error Trends</TabsTrigger>
					<TabsTrigger value="users">User Analytics</TabsTrigger>
					<TabsTrigger value="performance">Performance</TabsTrigger>
				</TabsList>

				<TabsContent value="errors" className="space-y-4">
					<ChartWidget
						title="Error Rate Over Time"
						description="Percentage of requests resulting in errors"
						endpoint={`/api/analytics/error-trends?range=${timeRange}`}
						chartType="line"
						dataKeys={[
							{
								key: "errorRate",
								label: "Error Rate (%)",
								color: "hsl(var(--destructive))",
							},
							{
								key: "warningRate",
								label: "Warning Rate (%)",
								color: "hsl(var(--warning))",
							},
						]}
						xAxisKey="timestamp"
						icon={AlertTriangle}
						height={300}
					/>

					<ChartWidget
						title="Errors by Type"
						description="Distribution of error types"
						endpoint={`/api/analytics/error-types?range=${timeRange}`}
						chartType="bar"
						dataKeys={[
							{
								key: "count",
								label: "Error Count",
								color: "hsl(var(--destructive))",
							},
						]}
						xAxisKey="type"
						icon={AlertTriangle}
						height={300}
					/>
				</TabsContent>

				<TabsContent value="users" className="space-y-4">
					<ChartWidget
						title="Daily Active Users"
						description="Number of unique users per day"
						endpoint={`/api/analytics/user-trends?range=${timeRange}`}
						chartType="line"
						dataKeys={[
							{
								key: "activeUsers",
								label: "Active Users",
								color: "hsl(var(--primary))",
							},
							{
								key: "newUsers",
								label: "New Users",
								color: "hsl(var(--secondary))",
							},
						]}
						xAxisKey="date"
						icon={Users}
						height={300}
					/>

					<ChartWidget
						title="User Engagement"
						description="Average session duration and page views"
						endpoint={`/api/analytics/user-engagement?range=${timeRange}`}
						chartType="bar"
						dataKeys={[
							{
								key: "sessionDuration",
								label: "Avg Session (min)",
								color: "hsl(var(--primary))",
							},
						]}
						xAxisKey="date"
						icon={Activity}
						height={300}
					/>
				</TabsContent>

				<TabsContent value="performance" className="space-y-4">
					<ChartWidget
						title="Page Load Times"
						description="Average and P95 load times"
						endpoint={`/api/analytics/performance-trends?range=${timeRange}`}
						chartType="line"
						dataKeys={[
							{
								key: "avgLoadTime",
								label: "Avg Load Time (ms)",
								color: "hsl(var(--primary))",
							},
							{
								key: "p95LoadTime",
								label: "P95 Load Time (ms)",
								color: "hsl(var(--warning))",
							},
						]}
						xAxisKey="timestamp"
						icon={Zap}
						height={300}
					/>

					<ChartWidget
						title="API Response Times"
						description="Average API latency by endpoint"
						endpoint={`/api/analytics/api-latency?range=${timeRange}`}
						chartType="bar"
						dataKeys={[
							{
								key: "latency",
								label: "Latency (ms)",
								color: "hsl(var(--primary))",
							},
						]}
						xAxisKey="endpoint"
						icon={Zap}
						height={300}
					/>
				</TabsContent>
			</Tabs>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Alert Triggers */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bell className="h-5 w-5" />
							Recent Alerts
						</CardTitle>
						<CardDescription>
							Triggered alerts and notifications
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-3">
								{[1, 2, 3, 4].map((i) => (
									<Skeleton key={i} className="h-16" />
								))}
							</div>
						) : alerts.length > 0 ? (
							<div className="space-y-3">
								{alerts.map((alert) => {
									const Icon = getAlertIcon(alert.type);
									return (
										<div
											key={alert.id}
											className="flex items-start gap-3 p-3 rounded-lg border"
										>
											<div
												className={`h-2 w-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`}
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<Icon className="h-4 w-4 text-muted-foreground" />
													<span className="font-medium text-sm">
														{alert.message}
													</span>
												</div>
												<div className="flex items-center gap-2 mt-1">
													<Badge
														variant="outline"
														className="text-xs capitalize"
													>
														{alert.severity}
													</Badge>
													<span className="text-xs text-muted-foreground">
														{alert.timestamp}
													</span>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						) : (
							<div className="text-center py-8 text-muted-foreground text-sm">
								No alerts triggered
							</div>
						)}
					</CardContent>
				</Card>

				{/* Correlation View */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Deploys vs Errors
						</CardTitle>
						<CardDescription>
							Correlation between deployments and error rates
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-[300px]" />
						) : correlationData.length > 0 ? (
							<ResponsiveContainer width="100%" height={300}>
								<ScatterChart>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-muted"
									/>
									<XAxis
										dataKey="deploys"
										name="Deploys"
										className="text-xs"
									/>
									<YAxis
										dataKey="errors"
										name="Errors"
										className="text-xs"
									/>
									<ZAxis
										dataKey="users"
										name="Users"
										range={[50, 400]}
									/>
									<Tooltip
										cursor={{ strokeDasharray: "3 3" }}
										contentStyle={{
											backgroundColor:
												"hsl(var(--background))",
											border: "1px solid hsl(var(--border))",
											borderRadius: "var(--radius)",
										}}
									/>
									<Legend />
									<Scatter
										name="Deploy Impact"
										data={correlationData}
										fill="hsl(var(--primary))"
									/>
								</ScatterChart>
							</ResponsiveContainer>
						) : (
							<div className="flex items-center justify-center h-[300px]">
								<div className="text-sm text-muted-foreground">
									No correlation data available
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
