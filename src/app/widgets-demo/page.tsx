"use client";

import {
	DollarSign,
	Users,
	CheckCircle2,
	GitCommit,
	TrendingUp,
	Activity,
} from "lucide-react";
import { StatCard } from "@/components/widgets/stat-card";
import { ChartWidget } from "@/components/widgets/chart-widget";
import { ListWidget } from "@/components/widgets/list-widget";
import { StatusWidget } from "@/components/widgets/status-widget";

export default function WidgetsDemoPage() {
	return (
		<div className="min-h-screen bg-background p-4 md:p-8">
			<div className="max-w-7xl mx-auto space-y-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight mb-2">
						Widget Components Demo
					</h1>
					<p className="text-muted-foreground">
						Reusable metric widgets with auto-refresh and API
						integration
					</p>
				</div>

				{/* StatCard Examples */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold">StatCard Widgets</h2>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						<StatCard
							title="Monthly Recurring Revenue"
							endpoint="/api/metrics/mrr"
							icon={DollarSign}
							formatter={(val) => `$${val.toLocaleString()}`}
							refreshInterval={30000}
							variant="success"
							description="vs last month"
						/>
						<StatCard
							title="Active Users"
							endpoint="/api/metrics/active-users"
							icon={Users}
							refreshInterval={30000}
						/>
						<StatCard
							title="Open Tasks"
							endpoint="/api/metrics/open-tasks"
							icon={CheckCircle2}
							refreshInterval={30000}
						/>
					</div>
				</section>

				{/* ChartWidget Examples */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold">
						ChartWidget Components
					</h2>
					<div className="grid gap-4 lg:grid-cols-2">
						<ChartWidget
							title="Revenue Over Time"
							description="Monthly revenue and expenses"
							endpoint="/api/charts/revenue"
							chartType="line"
							dataKeys={[
								{
									key: "revenue",
									label: "Revenue",
									color: "hsl(var(--secondary))",
								},
								{
									key: "expenses",
									label: "Expenses",
									color: "hsl(var(--destructive))",
								},
							]}
							xAxisKey="month"
							icon={TrendingUp}
							refreshInterval={60000}
							formatter={(val) => `$${val.toLocaleString()}`}
						/>
						<ChartWidget
							title="Task Velocity"
							description="Completed vs planned tasks per week"
							endpoint="/api/charts/task-velocity"
							chartType="bar"
							dataKeys={[
								{
									key: "completed",
									label: "Completed",
									color: "hsl(var(--secondary))",
								},
								{
									key: "planned",
									label: "Planned",
									color: "hsl(var(--primary))",
								},
							]}
							xAxisKey="week"
							icon={Activity}
							refreshInterval={60000}
						/>
					</div>
				</section>

				{/* ListWidget Examples */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold">
						ListWidget Components
					</h2>
					<div className="grid gap-4 lg:grid-cols-2">
						<ListWidget
							title="Recent Commits"
							description="Latest code changes"
							endpoint="/api/lists/recent-commits"
							icon={GitCommit}
							refreshInterval={30000}
							maxItems={5}
						/>
						<ListWidget
							title="Recent Tasks"
							description="Latest task updates"
							endpoint="/api/lists/recent-tasks"
							icon={CheckCircle2}
							refreshInterval={30000}
							maxItems={4}
						/>
					</div>
				</section>

				{/* StatusWidget Examples */}
				<section className="space-y-4">
					<h2 className="text-xl font-semibold">
						StatusWidget Components
					</h2>
					<div className="grid gap-4 lg:grid-cols-2">
						<StatusWidget
							title="System Health"
							description="Overall system status"
							endpoint="/api/status/system-health"
							icon={Activity}
							refreshInterval={15000}
						/>
						<StatusWidget
							title="CI/CD Pipeline"
							description="Build and deployment status"
							endpoint="/api/status/ci-cd"
							icon={GitCommit}
							refreshInterval={15000}
						/>
					</div>
				</section>
			</div>
		</div>
	);
}
