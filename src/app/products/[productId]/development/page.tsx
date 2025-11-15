/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	GitBranch,
	CheckCircle2,
	Activity,
	Rocket,
	AlertTriangle,
	TrendingUp,
	GitPullRequest,
	GitMerge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RepositoryManager } from "@/components/dashboard/repository-manager";
import { useCodeStore } from "@/zustand/providers/code-store-provider";
import { CodeCIMetrics } from "@/types/code";
import { CommitsCard } from "@/components/development/commits-card";
import { PRCard } from "@/components/development/pr-card";
import { SuccessRateCard } from "@/components/development/success-rate-card";
import { CommitPRChart } from "@/components/development/commit-pr-chart";
import { SuccessRateChart } from "@/components/development/success-rate-chart";
import { ContributorsCard } from "@/components/development/contributors-card";
import { DeploymentsCard } from "@/components/development/deployments-card";
import { CodeCIErrorState } from "@/components/development/code-ci-error-state";
import { CodeCINoRepositoriesState } from "@/components/development/code-ci-no-repositories-state";
import CodeCIPageLoading from "@/components/development/code-ci-page-loading";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { useParams } from "next/navigation";

export default function DevelopmentPage() {
	const { productId } = useParams();
	const repositories = useCodeStore((state) => state.repositories);
	const selectedRepositoryId = useCodeStore(
		(state) => state.selectedRepositoryId
	);
	const setSelectedRepository = useCodeStore(
		(state) => state.setSelectedRepository
	);
	const setRepositories = useCodeStore((state) => state.setRepositories);
	const integrations = useIntegrationsStore((state) => state.integrations);

	const [data, setData] = useState<CodeCIMetrics | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchRepositories = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(
				`/api/products/${productId}/code-ci/repositories`
			);
			if (!res.ok) throw new Error("Failed to fetch repositories");
			const { data } = await res.json();
			setRepositories(data);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [productId, setRepositories]);

	const fetchRepoData = useCallback(
		async (repoId: string) => {
			setLoading(true);
			setError(null);
			setData(null);
			try {
				const url = `/api/products/${productId}/code-ci/repositories/${repoId}`;
				const res = await fetch(url);

				if (!res.ok) {
					const txt = await res.text();
					throw new Error(txt || `HTTP ${res.status}`);
				}
				const payload: CodeCIMetrics = await res.json();
				setData(payload);
			} catch (err: any) {
				setError(err.message);
				setData(null);
			} finally {
				setLoading(false);
			}
		},
		[productId]
	);

	useEffect(() => {
		fetchRepositories();
	}, [fetchRepositories]);

	useEffect(() => {
		if (!selectedRepositoryId && repositories.length > 0) {
			setSelectedRepository(repositories[0].id);
		}
	}, [repositories, selectedRepositoryId, setSelectedRepository]);

	useEffect(() => {
		if (selectedRepositoryId) {
			fetchRepoData(selectedRepositoryId);
		}
	}, [selectedRepositoryId, fetchRepoData]);

	const hasCodeCIIntegration = useMemo(() => {
		return !!integrations.find((i) => i.category === "DEVELOPMENT");
	}, [integrations]);

	if (loading && !data) {
		return <CodeCIPageLoading productId={productId as string} />;
	}

	if (error && !data) {
		return (
			<CodeCIErrorState
				productId={productId as string}
				error={error}
				onRetry={fetchRepositories}
			/>
		);
	}

	if (!loading && repositories.length === 0) {
		return (
			<CodeCINoRepositoriesState
				productId={productId as string}
				hasIntegration={hasCodeCIIntegration}
			/>
		);
	}

	if (!data) {
		return <CodeCIPageLoading productId={productId as string} />;
	}

	const buildStatusColor =
		data.buildStatus === "success"
			? "text-green-500"
			: data.buildStatus === "failed"
				? "text-red-500"
				: "text-yellow-500";

	const getScoreColor = (score: number) => {
		if (score >= 90) return "text-green-600";
		if (score >= 80) return "text-blue-600";
		if (score >= 70) return "text-yellow-600";
		if (score >= 60) return "text-orange-600";
		return "text-red-600";
	};

	const getGradeBadgeVariant = (grade: string) => {
		if (grade === "A") return "default" as const;
		if (grade === "B") return "secondary" as const;
		if (grade === "C") return "outline" as const;
		return "destructive" as const;
	};

	const health = data.repositoryHealth;

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-8 flex items-center gap-4">
					<Link href="/products">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold text-foreground">
							Code & CI/CD
						</h1>
						<p className="mt-1 text-muted-foreground">
							Repository health, build status, and development
							metrics
						</p>
					</div>
				</div>

				<div className="mb-8 grid gap-8 lg:grid-cols-4">
					<div className="lg:col-span-1">
						<RepositoryManager
							productId={productId as string}
							repositories={repositories}
							selectedRepositoryId={selectedRepositoryId!}
							onSelectRepository={setSelectedRepository}
						/>
					</div>

					<div className="lg:col-span-3">
						<Tabs defaultValue="overview" className="space-y-6">
							<TabsList>
								<TabsTrigger value="overview">
									Overview
								</TabsTrigger>
								<TabsTrigger value="health">
									Health Details
								</TabsTrigger>
							</TabsList>

							<TabsContent value="overview" className="space-y-6">
								{/* Overall Health Score */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center justify-between">
											<span className="flex items-center gap-2">
												<Activity className="h-5 w-5" />
												Repository Health
											</span>
											{health && (
												<Badge
													variant={getGradeBadgeVariant(
														health.grade
													)}
													className="text-lg px-3 py-1"
												>
													Grade {health.grade}
												</Badge>
											)}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="flex items-center gap-8">
											<div className="flex-shrink-0">
												<div
													className={`text-6xl font-bold ${getScoreColor(health?.healthScore || 0)}`}
												>
													{health?.healthScore || 0}
												</div>
												<p className="text-sm text-muted-foreground text-center mt-1">
													out of 100
												</p>
											</div>
											<div className="flex-1 space-y-4">
												<div>
													<div className="flex justify-between text-sm mb-1">
														<span className="text-muted-foreground">
															Issue Health
														</span>
														<span className="font-medium">
															{health?.issueHealth
																.score || 0}
															/100
														</span>
													</div>
													<Progress
														value={
															health?.issueHealth
																.score || 0
														}
														className="h-2"
													/>
												</div>
												<div>
													<div className="flex justify-between text-sm mb-1">
														<span className="text-muted-foreground">
															PR Health
														</span>
														<span className="font-medium">
															{health?.prHealth
																.score || 0}
															/100
														</span>
													</div>
													<Progress
														value={
															health?.prHealth
																.score || 0
														}
														className="h-2"
													/>
												</div>
												<div>
													<div className="flex justify-between text-sm mb-1">
														<span className="text-muted-foreground">
															Deployment Health
														</span>
														<span className="font-medium">
															{health
																?.deploymentHealth
																.score || 0}
															/100
														</span>
													</div>
													<Progress
														value={
															health
																?.deploymentHealth
																.score || 0
														}
														className="h-2"
													/>
												</div>
												<div>
													<div className="flex justify-between text-sm mb-1">
														<span className="text-muted-foreground">
															Activity Health
														</span>
														<span className="font-medium">
															{health
																?.activityHealth
																.score || 0}
															/100
														</span>
													</div>
													<Progress
														value={
															health
																?.activityHealth
																.score || 0
														}
														className="h-2"
													/>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Quick Stats Grid */}
								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
									<Card>
										<CardHeader className="pb-3">
											<CardTitle className="flex items-center gap-2 text-sm font-medium">
												<GitBranch className="h-4 w-4 text-chart-1" />
												Commits
											</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-3xl font-bold">
												{data.commits}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												This period
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-3">
											<CardTitle className="flex items-center gap-2 text-sm font-medium">
												<GitPullRequest className="h-4 w-4 text-chart-2" />
												Pull Requests
											</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-3xl font-bold">
												{data.prs}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												Open & merged
											</p>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-3">
											<CardTitle className="flex items-center gap-2 text-sm font-medium">
												<CheckCircle2
													className={`h-4 w-4 ${buildStatusColor}`}
												/>
												Build Status
											</CardTitle>
										</CardHeader>
										<CardContent>
											<p
												className={`text-3xl font-bold capitalize ${buildStatusColor}`}
											>
												{data.buildStatus}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												Latest build
											</p>
										</CardContent>
									</Card>

									<SuccessRateCard
										buildSuccessRate={data.buildSuccessRate}
									/>
								</div>

								{/* Charts */}
								<div className="grid gap-6 lg:grid-cols-2">
									<CommitPRChart
										commitPRData={data.commitPRData}
									/>
									<SuccessRateChart
										buildTrendData={data.buildTrendData}
									/>
								</div>

								{/* Data Tables */}
								<CommitsCard commits={data.recentCommits} />
								<PRCard prs={data.recentPullRequests} />
								<ContributorsCard
									contributors={data.topContributors}
								/>
								<DeploymentsCard
									deployments={data.recentDeploys}
								/>

								{/* Insights */}
								<Card>
									<CardHeader>
										<CardTitle>Key Insights</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
											<p className="font-medium">
												Analysis:
											</p>
											<p className="mt-2">
												{data.insight}
											</p>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							{/* Health Details Tab */}
							<TabsContent value="health" className="space-y-6">
								{/* Issue Health Section */}
								<div>
									<h2 className="mb-4 text-xl font-semibold text-foreground flex items-center gap-2">
										<AlertTriangle className="h-5 w-5 text-orange-600" />
										Issue Health
										<Badge
											variant="outline"
											className="ml-auto"
										>
											{health?.issueHealth.score || 0}/100
										</Badge>
									</h2>
									<div className="grid gap-4 sm:grid-cols-3">
										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Open Issues
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-orange-600">
													{health?.issueHealth
														.openCount || 0}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													to resolve
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Stale Issues
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-red-600">
													{health?.issueHealth
														.staleCount || 0}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													&gt;60 days old
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Avg Resolution Time
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-blue-600">
													{health?.issueHealth
														.avgResolutionHours ||
														0}
													h
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													to close
												</p>
											</CardContent>
										</Card>
									</div>
								</div>

								{/* PR Health Section */}
								<div>
									<h2 className="mb-4 text-xl font-semibold text-foreground flex items-center gap-2">
										<GitMerge className="h-5 w-5 text-purple-600" />
										Pull Request Health
										<Badge
											variant="outline"
											className="ml-auto"
										>
											{health?.prHealth.score || 0}/100
										</Badge>
									</h2>
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Open PRs
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-blue-600">
													{health?.prHealth
														.openCount || 0}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													in review
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Stale PRs
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-yellow-600">
													{health?.prHealth
														.staleCount || 0}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													&gt;30 days old
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Merge Rate
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-green-600">
													{health?.prHealth
														.mergeRate || 0}
													%
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													merged vs closed
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Avg Review Time
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-purple-600">
													{health?.prHealth
														.avgReviewHours || 0}
													h
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													per PR
												</p>
											</CardContent>
										</Card>
									</div>
								</div>

								{/* Deployment Health Section */}
								<div>
									<h2 className="mb-4 text-xl font-semibold text-foreground flex items-center gap-2">
										<Rocket className="h-5 w-5 text-green-600" />
										Deployment Health (DORA)
										<Badge
											variant="outline"
											className="ml-auto"
										>
											{health?.deploymentHealth.score ||
												0}
											/100
										</Badge>
									</h2>
									<div className="grid gap-4 sm:grid-cols-3">
										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Deploy Frequency
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-green-600">
													{health?.deploymentHealth
														.weeklyFrequency || 0}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													per week
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Failure Rate
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-red-600">
													{health?.deploymentHealth
														.failureRate || 0}
													%
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													failed deploys
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Mean Time to Restore
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-blue-600">
													{health?.deploymentHealth
														.avgRestoreHours || 0}
													h
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													to fix failures
												</p>
											</CardContent>
										</Card>
									</div>
								</div>

								{/* Activity Health Section */}
								<div>
									<h2 className="mb-4 text-xl font-semibold text-foreground flex items-center gap-2">
										<TrendingUp className="h-5 w-5 text-blue-600" />
										Activity Health
										<Badge
											variant="outline"
											className="ml-auto"
										>
											{health?.activityHealth.score || 0}
											/100
										</Badge>
									</h2>
									<div className="grid gap-4 sm:grid-cols-3">
										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Weekly Commits
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-blue-600">
													{health?.activityHealth
														.weeklyCommits || 0}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													per week
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Active Contributors
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-purple-600">
													{health?.activityHealth
														.activeContributors ||
														0}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													last 90 days
												</p>
											</CardContent>
										</Card>

										<Card>
											<CardHeader className="pb-3">
												<CardTitle className="text-sm font-medium">
													Stale Branches
												</CardTitle>
											</CardHeader>
											<CardContent>
												<p className="text-3xl font-bold text-yellow-600">
													{health?.activityHealth
														.staleBranches || 0}
												</p>
												<p className="mt-1 text-xs text-muted-foreground">
													&gt;90 days old
												</p>
											</CardContent>
										</Card>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</div>
		</main>
	);
}
