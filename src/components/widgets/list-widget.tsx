"use client";

import type React from "react";

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
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ListWidgetProps {
	title: string;
	description?: string;
	endpoint: string;
	icon?: LucideIcon;
	refreshInterval?: number;
	maxItems?: number;
	renderItem?: (item: ListItem) => React.ReactNode;
}

export interface ListItem {
	id: string;
	title: string;
	description?: string;
	timestamp: string;
	status?: "success" | "error" | "warning" | "info";
	icon?: LucideIcon;
	metadata?: Record<string, JSON>;
}

interface ListData {
	items: ListItem[];
}

export function ListWidget({
	title,
	description,
	endpoint,
	icon: Icon,
	refreshInterval = 30000, // 30 seconds default
	maxItems = 5,
	renderItem,
}: ListWidgetProps) {
	const [items, setItems] = useState<ListItem[] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		try {
			const response = await fetch(endpoint);
			if (!response.ok) throw new Error("Failed to fetch list data");
			const result: ListData = await response.json();
			setItems(result.items.slice(0, maxItems));
			setError(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			console.error("[v0] ListWidget fetch error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();

		if (refreshInterval > 0) {
			const interval = setInterval(fetchData, refreshInterval);
			return () => clearInterval(interval);
		}
	}, [endpoint, refreshInterval]);

	const statusColors = {
		success: "bg-secondary/10 text-secondary border-secondary/20",
		error: "bg-destructive/10 text-destructive border-destructive/20",
		warning: "bg-chart-2/10 text-chart-2 border-chart-2/20",
		info: "bg-primary/10 text-primary border-primary/20",
	};

	const defaultRenderItem = (item: ListItem) => {
		const ItemIcon = item.icon;
		return (
			<div
				key={item.id}
				className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg"
			>
				{ItemIcon && (
					<div
						className={cn(
							"p-2 rounded-lg",
							item.status
								? statusColors[item.status]
								: "bg-muted text-muted-foreground"
						)}
					>
						<ItemIcon className="h-4 w-4" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between gap-2">
						<p className="font-medium text-sm leading-tight">
							{item.title}
						</p>
						{item.status && (
							<Badge
								variant="outline"
								className={cn(
									"text-xs",
									statusColors[item.status]
								)}
							>
								{item.status}
							</Badge>
						)}
					</div>
					{item.description && (
						<p className="text-sm text-muted-foreground mt-1">
							{item.description}
						</p>
					)}
					<span className="text-xs text-muted-foreground mt-1 block">
						{item.timestamp}
					</span>
				</div>
			</div>
		);
	};

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
					<div className="space-y-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex items-start gap-3">
								<Skeleton className="h-10 w-10 rounded-lg" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-3 w-1/2" />
								</div>
							</div>
						))}
					</div>
				) : error ? (
					<div className="text-center py-8 space-y-2">
						<div className="text-sm text-destructive">
							Failed to load items
						</div>
						<div className="text-xs text-muted-foreground">
							{error}
						</div>
					</div>
				) : items && items.length > 0 ? (
					<div className="space-y-2">
						{items.map((item) =>
							renderItem
								? renderItem(item)
								: defaultRenderItem(item)
						)}
					</div>
				) : (
					<div className="text-center py-8">
						<div className="text-sm text-muted-foreground">
							No items to display
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
