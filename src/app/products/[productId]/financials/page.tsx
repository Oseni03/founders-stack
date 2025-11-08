"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	DollarSign,
	TrendingDown,
	CreditCard,
	BarChart3,
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
import { useFinanceStore } from "@/zustand/providers/finance-store-provider";
import { FinancialStatusPageLoading } from "@/components/financials/financial-loading";
import { FinancialStatusNoDataState } from "@/components/financials/financial-no-data";
import { useParams } from "next/navigation";

export default function FinancialStatusPage() {
	const { productId } = useParams();
	const data = useFinanceStore((state) => state.data);
	const loading = useFinanceStore((state) => state.loading);
	const timeRange = useFinanceStore((state) => state.timeRange);
	const setData = useFinanceStore((state) => state.setData);
	const setLoading = useFinanceStore((state) => state.setLoading);
	const setTimeRange = useFinanceStore((state) => state.setTimeRange);

	useEffect(() => {
		fetchMetrics();
	}, [timeRange]);

	const fetchMetrics = async () => {
		try {
			setLoading(true);
			const response = await fetch(
				`/api/products/${productId}/finance?range=${timeRange}`
			);

			if (!response.ok) throw new Error("Failed to fetch metrics");

			const fetchedData = await response.json();
			setData(fetchedData);
		} catch (err) {
			console.error("[Financial Status] Fetch error:", err);
		} finally {
			setLoading(false);
		}
	};

	const ltv = useMemo(() => {
		if (!data) return 0;
		return Math.round((data.mrr * 12) / (data.churn || 1));
	}, [data]);

	const cac = useMemo(() => Math.round(ltv / 3), [ltv]);

	if (loading) {
		return <FinancialStatusPageLoading productId={productId as string} />;
	}

	if (!data) {
		return <FinancialStatusNoDataState productId={productId as string} />;
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
							Financial Status
						</h1>
						<p className="mt-1 text-muted-foreground">
							Revenue, churn, and subscription metrics
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

				{/* Key Metrics Grid */}
				<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<DollarSign className="h-4 w-4 text-chart-1" />
								Monthly Recurring Revenue
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								${data.mrr.toLocaleString()}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Current MRR
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<TrendingDown className="h-4 w-4 text-destructive" />
								Churn Rate
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold text-destructive">
								{data.churn.toFixed(1)}%
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Monthly churn
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<CreditCard className="h-4 w-4 text-chart-4" />
								Active Subscriptions
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{data.activeSubscriptions}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Paying customers
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="flex items-center gap-2 text-sm font-medium">
								<BarChart3 className="h-4 w-4 text-chart-3" />
								LTV:CAC Ratio
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-3xl font-bold">
								{(ltv / cac).toFixed(1)}:1
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Healthy ratio
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Charts Grid */}
				<div className="mb-8 grid gap-6 lg:grid-cols-2">
					{/* Revenue Trend */}
					<Card>
						<CardHeader>
							<CardTitle>Revenue Trend</CardTitle>
							<CardDescription>
								Monthly recurring revenue over 12 months
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80 w-full">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={data.revenueTrendData}>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="var(--border)"
										/>
										<XAxis
											dataKey="month"
											stroke="var(--muted-foreground)"
										/>
										<YAxis
											stroke="var(--muted-foreground)"
											tickFormatter={(value) =>
												`$${value.toLocaleString()}`
											}
										/>
										<Tooltip
											contentStyle={{
												backgroundColor: "var(--card)",
												border: "1px solid var(--border)",
												borderRadius: "var(--radius)",
											}}
											formatter={(value: number) =>
												`$${value.toLocaleString()}`
											}
										/>
										<Line
											type="monotone"
											dataKey="revenue"
											stroke="var(--chart-1)"
											strokeWidth={2}
											dot={false}
											name="Revenue"
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					{/* Customer Growth */}
					<Card>
						<CardHeader>
							<CardTitle>Customer Growth</CardTitle>
							<CardDescription>
								Active customers over 12 months
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80 w-full">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={data.customerGrowthData}>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="var(--border)"
										/>
										<XAxis
											dataKey="month"
											stroke="var(--muted-foreground)"
										/>
										<YAxis stroke="var(--muted-foreground)" />
										<Tooltip
											contentStyle={{
												backgroundColor: "var(--card)",
												border: "1px solid var(--border)",
												borderRadius: "var(--radius)",
											}}
										/>
										<Bar
											dataKey="customers"
											fill="var(--chart-3)"
											name="Customers"
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					{/* Transaction Volume */}
					<Card>
						<CardHeader>
							<CardTitle>Transaction Volume</CardTitle>
							<CardDescription>
								Subscriptions and payments over the last 7 days
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-80 w-full">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={data.transactionVolumeData}>
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
										/>
										<Bar
											dataKey="subscriptions"
											fill="var(--chart-1)"
											name="Subscriptions"
										/>
										<Bar
											dataKey="payments"
											fill="var(--chart-3)"
											name="Payments"
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Recent Transactions */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Recent Transactions</CardTitle>
						<CardDescription>
							Latest financial activity
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{data.recentTransactions.map((transaction) => (
								<div
									key={transaction.id}
									className="flex items-center justify-between rounded-lg border border-border p-4"
								>
									<div className="flex-1">
										<p className="font-medium text-foreground capitalize">
											{transaction.type}
										</p>
										<p className="text-sm text-muted-foreground">
											{new Date(
												transaction.date
											).toLocaleDateString()}
										</p>
									</div>
									<div className="text-right">
										<p className="font-semibold text-foreground">
											$
											{transaction.amount.toLocaleString()}
										</p>
										<p
											className={`text-xs font-medium ${
												transaction.status ===
													"completed" ||
												transaction.status === "paid"
													? "text-green-600"
													: "text-yellow-600"
											}`}
										>
											{transaction.status}
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
