"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function CommunicationPageLoading() {
	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
					<Skeleton className="h-8 w-24" />
				</div>

				<div className="grid gap-8 lg:grid-cols-4">
					{/* Channel Manager */}
					<div className="lg:col-span-1">
						<Card className="sticky top-8">
							<CardHeader className="pb-4">
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-10 w-full" />
								<Skeleton className="mt-2 h-8 w-full" />
								<Skeleton className="mt-2 h-8 w-full" />
							</CardContent>
						</Card>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3 space-y-8">
						{/* Key Metrics Grid */}
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{[...Array(3)].map((_, index) => (
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

						{/* Charts Grid */}
						<div className="grid gap-6 lg:grid-cols-2">
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
									<Skeleton className="h-80 w-full" />
								</CardContent>
							</Card>
						</div>

						{/* Messages */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<Skeleton className="h-6 w-32" />
										<Skeleton className="mt-1 h-4 w-48" />
									</div>
									<Skeleton className="h-8 w-24" />
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-3 max-h-96 overflow-y-auto">
									<Skeleton className="h-16 w-full rounded-lg" />
									<Skeleton className="h-16 w-full rounded-lg" />
									<Skeleton className="h-16 w-full rounded-lg" />
								</div>
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
				</div>
			</div>
		</main>
	);
}
