"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CodeCIPageLoading({
	productId,
}: {
	productId: string;
}) {
	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8 flex items-center gap-4">
					<Link href={`/products/${productId}`}>
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<Skeleton className="h-9 w-64" />
						<Skeleton className="mt-2 h-5 w-96" />
					</div>
				</div>

				<div className="mb-8 grid gap-8 lg:grid-cols-4">
					{/* Repository Manager */}
					<div className="lg:col-span-1">
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-10 w-full" />
								<Skeleton className="mt-2 h-8 w-full" />
								<Skeleton className="mt-2 h-8 w-full" />
							</CardContent>
						</Card>
					</div>

					{/* Repository Overview */}
					<div className="lg:col-span-3">
						<div className="mb-8">
							<Skeleton className="mb-4 h-6 w-48" />
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								{/* Health Score Card */}
								<Card className="lg:col-span-1 lg:row-span-2">
									<CardHeader className="pb-3">
										<Skeleton className="h-5 w-24" />
									</CardHeader>
									<CardContent className="flex flex-col items-center justify-center py-8">
										<Skeleton className="h-16 w-24" />
										<Skeleton className="mt-2 h-4 w-16" />
										<div className="mt-6 w-full space-y-2">
											<div className="flex justify-between">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-4 w-12" />
											</div>
											<Skeleton className="h-2 w-full rounded-full" />
										</div>
									</CardContent>
								</Card>

								{/* Commits Card */}
								<Card>
									<CardHeader className="pb-3">
										<Skeleton className="h-5 w-24" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-10 w-16" />
										<Skeleton className="mt-1 h-4 w-20" />
									</CardContent>
								</Card>

								{/* Pull Requests Card */}
								<Card>
									<CardHeader className="pb-3">
										<Skeleton className="h-5 w-24" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-10 w-16" />
										<Skeleton className="mt-1 h-4 w-20" />
									</CardContent>
								</Card>

								{/* Build Status Card */}
								<Card>
									<CardHeader className="pb-3">
										<Skeleton className="h-5 w-24" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-10 w-16" />
										<Skeleton className="mt-1 h-4 w-20" />
									</CardContent>
								</Card>

								{/* Success Rate Card */}
								<Card>
									<CardHeader className="pb-3">
										<Skeleton className="h-5 w-24" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-10 w-16" />
										<Skeleton className="mt-1 h-4 w-20" />
									</CardContent>
								</Card>

								{/* Open Issues Card */}
								<Card>
									<CardHeader className="pb-3">
										<Skeleton className="h-5 w-24" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-10 w-16" />
										<Skeleton className="mt-1 h-4 w-20" />
									</CardContent>
								</Card>

								{/* Stale PRs Card */}
								<Card>
									<CardHeader className="pb-3">
										<Skeleton className="h-5 w-24" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-10 w-16" />
										<Skeleton className="mt-1 h-4 w-20" />
									</CardContent>
								</Card>

								{/* Avg Review Time Card */}
								<Card>
									<CardHeader className="pb-3">
										<Skeleton className="h-5 w-24" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-10 w-16" />
										<Skeleton className="mt-1 h-4 w-20" />
									</CardContent>
								</Card>
							</div>
						</div>

						{/* Charts */}
						<div className="mb-8 grid gap-6 lg:grid-cols-2">
							<Card>
								<CardHeader>
									<Skeleton className="h-6 w-32" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-64 w-full" />
								</CardContent>
							</Card>
							<Card>
								<CardHeader>
									<Skeleton className="h-6 w-32" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-64 w-full" />
								</CardContent>
							</Card>
						</div>

						{/* Commits Card */}
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-12 w-full" />
								<Skeleton className="mt-2 h-12 w-full" />
								<Skeleton className="mt-2 h-12 w-full" />
							</CardContent>
						</Card>

						{/* PR Card */}
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-12 w-full" />
								<Skeleton className="mt-2 h-12 w-full" />
								<Skeleton className="mt-2 h-12 w-full" />
							</CardContent>
						</Card>

						{/* Contributors Card */}
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-12 w-full" />
								<Skeleton className="mt-2 h-12 w-full" />
								<Skeleton className="mt-2 h-12 w-full" />
							</CardContent>
						</Card>

						{/* Deployments Card */}
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
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
				</div>
			</div>
		</main>
	);
}
