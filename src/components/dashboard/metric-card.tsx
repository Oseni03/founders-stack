"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDown, ArrowUp, LucideIcon, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
	title: string;
	value: string;
	change: string;
	trend: "up" | "down" | "neutral";
	icon: LucideIcon;
	isLoading?: boolean;
	description?: string;
	variant?: "default" | "warning" | "error";
}

export function MetricCard({
	title,
	value,
	change,
	trend,
	icon: Icon,
	isLoading = false,
	description,
	variant = "default",
}: MetricCardProps) {
	const trendColors = {
		up: "text-secondary",
		down: "text-destructive",
		neutral: "text-muted-foreground",
	};

	const variantStyles = {
		default: "",
		warning: "border-chart-2/50 bg-chart-2/5",
		error: "border-destructive/50 bg-destructive/5",
	};

	const TrendIcon =
		trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;

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
				) : (
					<>
						<div className="text-2xl font-bold">{value}</div>
						<div className="flex items-center gap-2 mt-1">
							<div
								className={cn(
									"flex items-center gap-1 text-xs font-medium",
									trendColors[trend]
								)}
							>
								<TrendIcon className="h-3 w-3" />
								{change}
							</div>
							{description && (
								<span className="text-xs text-muted-foreground">
									{description}
								</span>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
