"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
	Activity,
	AlertCircle,
	ArrowDown,
	CheckCircle2,
	Code,
	DollarSign,
	GitBranch,
	TrendingUp,
	Users,
	Zap,
} from "lucide-react";

export default function DashboardPage() {
	const [isLoading, setIsLoading] = useState(false);

	return (
		<div className="p-6">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight text-balance mb-2">
					Dashboard
				</h1>
				<p className="text-muted-foreground text-balance">
					Monitor your entire stack from one place
				</p>
			</div>

			{/* Project Health Section */}
			<section className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold flex items-center gap-2">
						<Activity className="h-5 w-5 text-primary" />
						Project Health
					</h2>
					<Button variant="ghost" size="sm">
						View All
					</Button>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<MetricCard
						title="Active Tasks"
						value="24"
						change="+12%"
						trend="up"
						icon={CheckCircle2}
						isLoading={isLoading}
						description="Across all projects"
					/>
					<MetricCard
						title="Completion Rate"
						value="87%"
						change="+5%"
						trend="up"
						icon={TrendingUp}
						isLoading={isLoading}
						description="Last 30 days"
					/>
					<MetricCard
						title="Team Velocity"
						value="42"
						change="-3%"
						trend="down"
						icon={Zap}
						isLoading={isLoading}
						description="Story points/sprint"
					/>
					<MetricCard
						title="Blockers"
						value="3"
						change="0"
						trend="neutral"
						icon={AlertCircle}
						isLoading={isLoading}
						description="Requires attention"
						variant="warning"
					/>
				</div>
			</section>

			{/* Financial Status Section */}
			<section className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold flex items-center gap-2">
						<DollarSign className="h-5 w-5 text-primary" />
						Financial Status
					</h2>
					<Button variant="ghost" size="sm">
						View Details
					</Button>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<MetricCard
						title="MRR"
						value="$12,450"
						change="+18%"
						trend="up"
						icon={DollarSign}
						isLoading={isLoading}
						description="Monthly recurring"
					/>
					<MetricCard
						title="Active Customers"
						value="156"
						change="+23"
						trend="up"
						icon={Users}
						isLoading={isLoading}
						description="Paying subscribers"
					/>
					<MetricCard
						title="Churn Rate"
						value="2.3%"
						change="-0.5%"
						trend="up"
						icon={ArrowDown}
						isLoading={isLoading}
						description="Below target"
					/>
					<MetricCard
						title="Avg Revenue/User"
						value="$79.81"
						change="+$4.20"
						trend="up"
						icon={TrendingUp}
						isLoading={isLoading}
						description="Per month"
					/>
				</div>
			</section>

			{/* Code Activity Section */}
			<section className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold flex items-center gap-2">
						<Code className="h-5 w-5 text-primary" />
						Code Activity
					</h2>
					<Button variant="ghost" size="sm">
						View Repository
					</Button>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<MetricCard
						title="Commits Today"
						value="18"
						change="+6"
						trend="up"
						icon={GitBranch}
						isLoading={isLoading}
						description="Across all branches"
					/>
					<MetricCard
						title="Open PRs"
						value="7"
						change="+2"
						trend="neutral"
						icon={Code}
						isLoading={isLoading}
						description="Awaiting review"
					/>
					<MetricCard
						title="Deployments"
						value="12"
						change="+4"
						trend="up"
						icon={Zap}
						isLoading={isLoading}
						description="This week"
					/>
					<MetricCard
						title="Build Success"
						value="94%"
						change="+2%"
						trend="up"
						icon={CheckCircle2}
						isLoading={isLoading}
						description="Last 50 builds"
					/>
				</div>
			</section>

			{/* Error Monitoring Section */}
			<section className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-primary" />
						Error Monitoring
					</h2>
					<Button variant="ghost" size="sm">
						View All Errors
					</Button>
				</div>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<MetricCard
						title="Active Errors"
						value="5"
						change="-3"
						trend="up"
						icon={AlertCircle}
						isLoading={isLoading}
						description="Unresolved issues"
						variant="error"
					/>
					<MetricCard
						title="Error Rate"
						value="0.12%"
						change="-0.05%"
						trend="up"
						icon={ArrowDown}
						isLoading={isLoading}
						description="Of total requests"
					/>
					<MetricCard
						title="Avg Response Time"
						value="245ms"
						change="+12ms"
						trend="down"
						icon={Activity}
						isLoading={isLoading}
						description="API endpoints"
					/>
					<MetricCard
						title="Uptime"
						value="99.97%"
						change="0%"
						trend="neutral"
						icon={CheckCircle2}
						isLoading={isLoading}
						description="Last 30 days"
					/>
				</div>
			</section>

			{/* Recent Activity */}
			<section>
				<h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
				<Card>
					<CardContent className="p-0">
						{isLoading ? (
							<div className="p-6 space-y-4">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						) : (
							<div className="divide-y">
								<ActivityItem
									icon={GitBranch}
									title="New deployment to production"
									description="v2.4.1 deployed successfully"
									time="5 minutes ago"
									status="success"
								/>
								<ActivityItem
									icon={DollarSign}
									title="New customer signup"
									description="Pro plan - $99/month"
									time="12 minutes ago"
									status="success"
								/>
								<ActivityItem
									icon={AlertCircle}
									title="Error spike detected"
									description="API endpoint /users returning 500"
									time="1 hour ago"
									status="error"
								/>
								<ActivityItem
									icon={CheckCircle2}
									title="Sprint completed"
									description="24 tasks completed, 87% velocity"
									time="2 hours ago"
									status="success"
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</section>
		</div>
	);
}

import { LucideIcon } from "lucide-react";

function ActivityItem({
	icon: Icon,
	title,
	description,
	time,
	status,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	time: string;
	status: "success" | "error" | "warning";
}) {
	const statusColors = {
		success: "text-secondary",
		error: "text-destructive",
		warning: "text-chart-2",
	};

	return (
		<div className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
			<div className={`p-2 rounded-lg bg-muted ${statusColors[status]}`}>
				<Icon className="h-4 w-4" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="font-medium text-sm">{title}</p>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
			<span className="text-xs text-muted-foreground whitespace-nowrap">
				{time}
			</span>
		</div>
	);
}
