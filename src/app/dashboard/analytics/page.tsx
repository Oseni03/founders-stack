"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export default function AnalyticsPage() {
	const data = [
		{
			name: "Jan",
			total: Math.floor(Math.random() * 5000) + 1000,
		},
		{
			name: "Feb",
			total: Math.floor(Math.random() * 5000) + 1000,
		},
		{
			name: "Mar",
			total: Math.floor(Math.random() * 5000) + 1000,
		},
		{
			name: "Apr",
			total: Math.floor(Math.random() * 5000) + 1000,
		},
		{
			name: "May",
			total: Math.floor(Math.random() * 5000) + 1000,
		},
		{
			name: "Jun",
			total: Math.floor(Math.random() * 5000) + 1000,
		},
		{
			name: "Jul",
			total: Math.floor(Math.random() * 5000) + 1000,
		},
	];

	return (
		<div className="container mx-auto py-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
				<p className="text-muted-foreground">
					Monitor key metrics across your tools
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							MRR
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">$12,345</div>
						<p className="text-xs text-muted-foreground">
							+20.1% from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Issues
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">24</div>
						<p className="text-xs text-muted-foreground">
							12 high priority
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Deploy Success Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">98.2%</div>
						<p className="text-xs text-muted-foreground">
							Last 30 days
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Customer Tickets
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">18</div>
						<p className="text-xs text-muted-foreground">
							Avg response: 2.4h
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="mt-6">
				<Card>
					<CardHeader>
						<CardTitle>Revenue Overview</CardTitle>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={350}>
							<BarChart data={data}>
								<XAxis
									dataKey="name"
									stroke="#888888"
									fontSize={12}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									stroke="#888888"
									fontSize={12}
									tickLine={false}
									axisLine={false}
									tickFormatter={(value) => `$${value}`}
								/>
								<Bar
									dataKey="total"
									fill="currentColor"
									radius={[4, 4, 0, 0]}
									className="fill-primary"
								/>
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
