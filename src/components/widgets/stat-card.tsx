"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
	title: string;
	endpoint: string;
	icon: LucideIcon;
	formatter?: (value: number) => string;
	refreshInterval?: number; // in milliseconds, 0 to disable
	variant?: "default" | "warning" | "error" | "success";
	description?: string;
}

interface StatData {
	value: number;
	change: number;
	trend: "up" | "down" | "neutral";
	label?: string;
}

export function StatCard({
	title,
	endpoint,
	icon: Icon,
	formatter = (val) => val.toString(),
	refreshInterval = 30000, // 30 seconds default
	variant = "default",
	description,
}: StatCardProps) {
	const [data, setData] = useState<StatData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	

	useEffect(() => {
        const fetchData = async () => {
			try {
				const response = await fetch(endpoint);
				if (!response.ok) throw new Error("Failed to fetch data");
				const result = await response.json();
				setData(result);
				setError(null);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				console.error("[v0] StatCard fetch error:", err);
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

	const trendColors = {
		up: "text-secondary",
		down: "text-destructive",
		neutral: "text-muted-foreground",
	};

	const variantStyles = {
		default: "",
		warning: "border-chart-2/50 bg-chart-2/5",
		error: "border-destructive/50 bg-destructive/5",
		success: "border-secondary/50 bg-secondary/5",
	};

	const TrendIcon =
		data?.trend === "up"
			? ArrowUp
			: data?.trend === "down"
				? ArrowDown
				: Minus;

	return (
		<Card
			className={cn(
				"transition-all hover:shadow-md",
				variantStyles[variant]
			)}
		>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-24" />
						<Skeleton className="h-4 w-16" />
					</div>
				) : error ? (
					<div className="space-y-1">
						<div className="text-sm text-destructive">
							Error loading data
						</div>
						<div className="text-xs text-muted-foreground">
							{error}
						</div>
					</div>
				) : data ? (
					<>
						<div className="text-2xl font-bold">
							{formatter(data.value)}
						</div>
						<div className="flex items-center gap-2 mt-1">
							<div
								className={cn(
									"flex items-center gap-1 text-xs font-medium",
									trendColors[data.trend]
								)}
							>
								<TrendIcon className="h-3 w-3" />
								{data.change > 0 ? "+" : ""}
								{formatter(data.change)}
							</div>
							{(description || data.label) && (
								<span className="text-xs text-muted-foreground">
									{description || data.label}
								</span>
							)}
						</div>
					</>
				) : null}
			</CardContent>
		</Card>
	);
}
