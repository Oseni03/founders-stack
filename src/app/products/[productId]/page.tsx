"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProjectHealthCard } from "@/components/dashboard/project-health-card";
import { FinancialStatusCard } from "@/components/dashboard/financial-status-card";
import { AnalyticsCard } from "@/components/dashboard/analytics-card";
import { FeedbackCard } from "@/components/dashboard/feedback-card";
import { CodeCICard } from "@/components/dashboard/code-ci-card";
import { CommunicationCard } from "@/components/dashboard/communication-card";
import { Search, Calendar } from "lucide-react";
import { useDashboardStore } from "@/zustand/providers/dashboard-store-provider";
import { DashboardContentLoading } from "@/components/dashboard/dashboard-loading";
import { useParams } from "next/navigation";

export default function DashboardContent() {
	const { productId } = useParams();
	const data = useDashboardStore((s) => s.data);
	const loading = useDashboardStore((s) => s.loading);
	const error = useDashboardStore((s) => s.error);
	const range = useDashboardStore((s) => s.range);
	const searchQuery = useDashboardStore((s) => s.searchQuery);
	const setRange = useDashboardStore((s) => s.setRange);
	const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);
	const fetchData = useDashboardStore((s) => s.fetchData);

	useEffect(() => {
		fetchData(productId as string);
	}, [range, searchQuery, fetchData, productId]);

	if (loading) {
		return <DashboardContentLoading />;
	}

	if (error || !data) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="mb-4 text-lg font-semibold text-destructive">
						{error || "No metrics available"}
					</p>
					<Button onClick={() => fetchData(productId as string)}>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground">
						Dashboard
					</h1>
					<p className="mt-2 text-muted-foreground">
						Your unified command center for all metrics
					</p>
				</div>

				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative flex-1 sm:max-w-xs">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search metrics..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>

					<div className="flex flex-wrap gap-2 sm:gap-3">
						{["7d", "30d", "90d"].map((r) => (
							<Button
								key={r}
								variant={range === r ? "default" : "outline"}
								onClick={() =>
									setRange(r as "7d" | "30d" | "90d")
								}
								size="sm"
								className="flex-1 gap-2 sm:flex-none"
							>
								<Calendar className="hidden h-4 w-4 sm:inline" />
								<span className="sm:hidden">{r}</span>
								<span className="hidden sm:inline">
									{r === "7d"
										? "Last 7 days"
										: r === "30d"
											? "Last 30 days"
											: "Last 90 days"}
								</span>
							</Button>
						))}
					</div>
				</div>

				<div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					<ProjectHealthCard data={data.project} />
					<FinancialStatusCard data={data.finance} />
					<AnalyticsCard
						productId={productId as string}
						data={data.analytics}
					/>
					<FeedbackCard data={data.feedback} />
					<CodeCICard
						productId={productId as string}
						data={data.code}
					/>
					<CommunicationCard
						productId={productId as string}
						data={data.communication}
					/>
				</div>

				<div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
					<p>Last updated: {new Date().toLocaleString()}</p>
					<p className="mt-2">Data syncs every 15 minutes</p>
				</div>
			</div>
		</main>
	);
}
