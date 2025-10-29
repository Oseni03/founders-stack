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
import { DollarSign } from "lucide-react";
import Link from "next/link";
import type { Metrics } from "@/lib/schemas";

interface FinancialStatusCardProps {
	data: Metrics["finance"];
}

export function FinancialStatusCard({ data }: FinancialStatusCardProps) {
	// Simulate MRR trend data
	const mrrTrendData = [
		{ name: "Week 1", mrr: 4500, churn: 6.2 },
		{ name: "Week 2", mrr: 4800, churn: 5.8 },
		{ name: "Week 3", mrr: 5000, churn: 5.2 },
	];

	const mrrColor = data.mrr > 4500 ? "text-green-600" : "text-orange-600";

	return (
		<Link href="/dashboard/financial-status">
			<Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<DollarSign className="h-5 w-5" />
						Financial Status
					</CardTitle>
					<CardDescription>Revenue & churn metrics</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Key Metric - MRR Gauge */}
					<div className="rounded-lg bg-muted p-4">
						<p className="text-sm font-medium text-muted-foreground">
							Monthly Recurring Revenue
						</p>
						<p className={`text-3xl font-bold ${mrrColor}`}>
							${data.mrr.toLocaleString()}
						</p>
						<p className="mt-2 text-sm text-muted-foreground">
							Churn Rate:{" "}
							<span className="font-semibold text-foreground">
								{data.churn.toFixed(1)}%
							</span>
						</p>
					</div>

					{/* MRR & Churn Trend */}
					<div className="h-40 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={mrrTrendData}>
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
									yAxisId="left"
									stroke="var(--muted-foreground)"
									style={{ fontSize: "12px" }}
								/>
								<YAxis
									yAxisId="right"
									orientation="right"
									stroke="var(--muted-foreground)"
									style={{ fontSize: "12px" }}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "var(--card)",
										border: "1px solid var(--border)",
										borderRadius: "var(--radius)",
									}}
									formatter={(value) =>
										typeof value === "number"
											? value > 100
												? `$${value}`
												: `${value.toFixed(1)}%`
											: value
									}
								/>
								<Line
									type="monotone"
									dataKey="mrr"
									stroke="var(--chart-1)"
									strokeWidth={2}
									dot={false}
									yAxisId="left"
								/>
								<Line
									type="monotone"
									dataKey="churn"
									stroke="var(--chart-2)"
									strokeWidth={2}
									dot={false}
									yAxisId="right"
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* Recent Transactions */}
					<div className="space-y-2">
						<p className="text-sm font-semibold text-foreground">
							Recent Transactions
						</p>
						<div className="space-y-1">
							{data.recentTransactions.slice(0, 3).map((tx) => (
								<div
									key={tx.id}
									className="flex items-center justify-between rounded bg-muted p-2 text-sm"
								>
									<span className="capitalize">
										{tx.type}
									</span>
									<span className="font-semibold text-green-600">
										+${tx.amount}
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
