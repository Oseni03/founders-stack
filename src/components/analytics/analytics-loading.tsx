"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function AnalyticsPageLoading() {
	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8 flex items-center gap-4">
					<Link href="/dashboard">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div className="flex-1">
						<Skeleton className="h-9 w-64" />
						<Skeleton className="mt-2 h-5 w-96" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-8 w-12" />
						<Skeleton className="h-8 w-12" />
						<Skeleton className="h-8 w-12" />
					</div>
				</div>

				{/* Summary Cards */}
				<div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{[...Array(4)].map((_, index) => (
						<Card key={index}>
							<CardHeader className="pb-3">
								<Skeleton className="h-5 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-10 w-16" />
								<Skeleton className="mt-1 h-4 w-20" />
							</CardContent>
						</Card>
					))}
				</div>

				{/* Event Types and Device Types */}
				<div className="mb-8 grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
							<Skeleton className="mt-1 h-4 w-48" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-80 w-full" />
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
							<Skeleton className="mt-1 h-4 w-48" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-12 w-full" />
							<Skeleton className="mt-2 h-12 w-full" />
							<Skeleton className="mt-2 h-12 w-full" />
						</CardContent>
					</Card>
				</div>

				{/* Event Trends */}
				<Card className="mb-8">
					<CardHeader>
						<Skeleton className="h-6 w-32" />
						<Skeleton className="mt-1 h-4 w-48" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-80 w-full" />
					</CardContent>
				</Card>

				{/* Top Pages and Top Referrers */}
				<div className="mb-8 grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
							<Skeleton className="mt-1 h-4 w-48" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-12 w-full" />
							<Skeleton className="mt-2 h-12 w-full" />
							<Skeleton className="mt-2 h-12 w-full" />
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
							<Skeleton className="mt-1 h-4 w-48" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-12 w-full" />
							<Skeleton className="mt-2 h-12 w-full" />
							<Skeleton className="mt-2 h-12 w-full" />
						</CardContent>
					</Card>
				</div>

				{/* Geographic Distribution */}
				<Card className="mb-8">
					<CardHeader>
						<Skeleton className="h-6 w-32" />
						<Skeleton className="mt-1 h-4 w-48" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-12 w-full" />
						<Skeleton className="mt-2 h-12 w-full" />
						<Skeleton className="mt-2 h-12 w-full" />
					</CardContent>
				</Card>

				{/* Key Insights */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-16 w-full rounded-lg" />
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
