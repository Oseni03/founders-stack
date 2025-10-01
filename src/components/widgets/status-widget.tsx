"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
	AlertCircle,
	CheckCircle2,
	XCircle,
	AlertTriangle,
	type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatusWidgetProps {
	title: string;
	description?: string;
	endpoint: string;
	icon?: LucideIcon;
	refreshInterval?: number;
	thresholds?: {
		excellent?: number;
		good?: number;
		warning?: number;
	};
}

export interface StatusData {
	status: "excellent" | "good" | "warning" | "critical";
	value: number;
	label: string;
	message?: string;
	indicators: StatusIndicator[];
}

export interface StatusIndicator {
	id: string;
	label: string;
	status: "healthy" | "degraded" | "down";
	value?: string;
	lastChecked?: string;
}

export function StatusWidget({
	title,
	description,
	endpoint,
	icon: Icon,
	refreshInterval = 15000, // 15 seconds default for health checks
}: StatusWidgetProps) {
	const [data, setData] = useState<StatusData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(endpoint);
				if (!response.ok)
					throw new Error("Failed to fetch status data");
				const result = await response.json();
				setData(result);
				setError(null);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				console.error("[v0] StatusWidget fetch error:", err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();

		if (refreshInterval > 0) {
			const interval = setInterval(fetchData, refreshInterval);
			return () => clearInterval(interval);
		}
	}, [endpoint, refreshInterval]);

	const statusConfig = {
		excellent: {
			icon: CheckCircle2,
			color: "text-secondary",
			bgColor: "bg-secondary/10",
			borderColor: "border-secondary/20",
			label: "Excellent",
		},
		good: {
			icon: CheckCircle2,
			color: "text-primary",
			bgColor: "bg-primary/10",
			borderColor: "border-primary/20",
			label: "Good",
		},
		warning: {
			icon: AlertTriangle,
			color: "text-chart-2",
			bgColor: "bg-chart-2/10",
			borderColor: "border-chart-2/20",
			label: "Warning",
		},
		critical: {
			icon: XCircle,
			color: "text-destructive",
			bgColor: "bg-destructive/10",
			borderColor: "border-destructive/20",
			label: "Critical",
		},
	};

	const indicatorConfig = {
		healthy: {
			icon: CheckCircle2,
			color: "text-secondary",
			label: "Healthy",
		},
		degraded: {
			icon: AlertCircle,
			color: "text-chart-2",
			label: "Degraded",
		},
		down: {
			icon: XCircle,
			color: "text-destructive",
			label: "Down",
		},
	};

	const config = data ? statusConfig[data.status] : null;
	const StatusIcon = config?.icon || AlertCircle;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{Icon && <Icon className="h-5 w-5" />}
					{title}
				</CardTitle>
				{description && (
					<CardDescription>{description}</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<Skeleton className="h-12 w-12 rounded-full" />
							<div className="space-y-2 flex-1">
								<Skeleton className="h-6 w-24" />
								<Skeleton className="h-4 w-32" />
							</div>
						</div>
						<div className="space-y-2">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					</div>
				) : error ? (
					<div className="text-center py-8 space-y-2">
						<div className="text-sm text-destructive">
							Failed to load status
						</div>
						<div className="text-xs text-muted-foreground">
							{error}
						</div>
					</div>
				) : data && config ? (
					<div className="space-y-4">
						{/* Overall Status */}
						<div className="flex items-center gap-4">
							<div
								className={cn(
									"p-3 rounded-full",
									config.bgColor,
									config.color
								)}
							>
								<StatusIcon className="h-6 w-6" />
							</div>
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<span className="text-2xl font-bold">
										{data.value}%
									</span>
									<Badge
										variant="outline"
										className={cn(
											config.color,
											config.bgColor,
											config.borderColor
										)}
									>
										{config.label}
									</Badge>
								</div>
								<p className="text-sm text-muted-foreground mt-1">
									{data.label}
								</p>
								{data.message && (
									<p className="text-xs text-muted-foreground mt-1">
										{data.message}
									</p>
								)}
							</div>
						</div>

						{/* Individual Indicators */}
						{data.indicators && data.indicators.length > 0 && (
							<div className="space-y-2 pt-2 border-t">
								{data.indicators.map((indicator) => {
									const indConfig =
										indicatorConfig[indicator.status];
									const IndicatorIcon = indConfig.icon;
									return (
										<div
											key={indicator.id}
											className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
										>
											<div className="flex items-center gap-2">
												<IndicatorIcon
													className={cn(
														"h-4 w-4",
														indConfig.color
													)}
												/>
												<span className="text-sm font-medium">
													{indicator.label}
												</span>
											</div>
											<div className="flex items-center gap-2">
												{indicator.value && (
													<span className="text-sm text-muted-foreground">
														{indicator.value}
													</span>
												)}
												<Badge
													variant="outline"
													className={cn(
														"text-xs",
														indConfig.color
													)}
												>
													{indConfig.label}
												</Badge>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
