"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search } from "lucide-react";

export function DashboardContentLoading() {
	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<Skeleton className="h-9 w-64" />
					<Skeleton className="mt-2 h-5 w-96" />
				</div>

				{/* Search and Range Selector */}
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="relative flex-1 sm:max-w-xs">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Skeleton className="h-10 w-full pl-10" />
					</div>
					<div className="flex flex-wrap gap-2 sm:gap-3">
						{["7d", "30d", "90d"].map((_, index) => (
							<Skeleton
								key={index}
								className="h-8 w-20 sm:w-32 flex-1 sm:flex-none"
							/>
						))}
					</div>
				</div>

				{/* Cards Grid */}
				<div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, index) => (
						<Card key={index} className="hover:shadow-lg">
							<CardHeader>
								<Skeleton className="h-6 w-32" />
								<Skeleton className="mt-1 h-4 w-48" />
							</CardHeader>
							<CardContent className="space-y-4">
								<Skeleton className="h-20 w-full rounded-lg" />
								<Skeleton className="h-40 w-full" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									{[...Array(3)].map((_, i) => (
										<div
											key={i}
											className="flex items-start justify-between rounded bg-muted p-2"
										>
											<div className="flex-1">
												<Skeleton className="h-4 w-24" />
												<Skeleton className="mt-1 h-3 w-48" />
											</div>
											<Skeleton className="h-6 w-12" />
										</div>
									))}
								</div>
								<Skeleton className="h-12 w-full rounded-lg" />
							</CardContent>
						</Card>
					))}
				</div>

				{/* Footer */}
				<div className="mt-12 border-t border-border pt-8 text-center">
					<Skeleton className="mx-auto h-4 w-48" />
					<Skeleton className="mx-auto mt-2 h-4 w-32" />
				</div>
			</div>
		</main>
	);
}
