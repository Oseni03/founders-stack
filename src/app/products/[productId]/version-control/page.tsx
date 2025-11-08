/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	GitBranch,
	Zap,
	CheckCircle2,
	Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RepositoryManager } from "@/components/dashboard/repository-manager";
import { useCodeStore } from "@/zustand/providers/code-store-provider";
import { CodeCIMetrics } from "@/types/code";
import { CommitsCard } from "@/components/code/commits-card";
import { PRCard } from "@/components/code/pr-card";
import { SuccessRateCard } from "@/components/code/success-rate-card";
import { CommitPRChart } from "@/components/code/commit-pr-chart";
import { SuccessRateChart } from "@/components/code/success-rate-chart";
import { ContributorsCard } from "@/components/code/contributors-card";
import { DeploymentsCard } from "@/components/code/deployments-card";
import { CodeCIErrorState } from "@/components/code/code-ci-error-state";
import { CodeCINoRepositoriesState } from "@/components/code/code-ci-no-repositories-state";
import CodeCIPageLoading from "@/components/code/code-ci-page-loading";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { useParams } from "next/navigation";

export default function CodeCIPage() {
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

	// Local state for data fetching
	const [data, setData] = useState<CodeCIMetrics | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchRepositories = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/code-ci/repositories");
			if (!res.ok) throw new Error("Failed to fetch repositories");
			const { data } = await res.json();
			setRepositories(data);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [setRepositories]);

	const fetchRepoData = useCallback(async (repoId: string) => {
		setLoading(true);
		setError(null);
		setData(null); // Clear old data immediately
		try {
			const url = `/api/code-ci/repositories/${repoId}`;
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
	}, []);

	// Load repos on mount
	useEffect(() => {
		fetchRepositories();
	}, [fetchRepositories]);

	// Auto-select first repo
	useEffect(() => {
		if (!selectedRepositoryId && repositories.length > 0) {
			setSelectedRepository(repositories[0].id);
		}
	}, [repositories, selectedRepositoryId, setSelectedRepository]);

	// Fetch data when repo is selected
	useEffect(() => {
		if (selectedRepositoryId) {
			fetchRepoData(selectedRepositoryId);
		}
	}, [selectedRepositoryId, fetchRepoData]);

	const hasCodeCIIntegration = useMemo(() => {
		return !!integrations.find((i) => i.category === "DEVELOPMENT");
	}, [integrations]);

	// Loading state
	if (loading && !data) {
		return <CodeCIPageLoading productId={productId as string} />; // From previous response
	}

	// Error state
	if (error && !data) {
		return (
			<CodeCIErrorState
				productId={productId as string}
				error={error}
				onRetry={fetchRepositories}
			/>
		);
	}

	// No repositories
	if (!loading && repositories.length === 0) {
		return (
			<CodeCINoRepositoriesState
				productId={productId as string}
				hasIntegration={hasCodeCIIntegration}
			/>
		);
	}

	// No data yet
	if (!data) {
		return <CodeCIPageLoading productId={productId as string} />;
	}

	const buildStatusColor =
		data.buildStatus === "success"
			? "text-green-500"
			: data.buildStatus === "failed"
				? "text-red-500"
				: "text-yellow-500";

	const getHealthScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		return "text-red-600";
	};

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
							Build status, commits, PRs, contributors, and
							repository health
						</p>
					</div>
				</div>

				<div className="mb-8 grid gap-8 lg:grid-cols-4">
					<div className="lg:col-span-1">
						<RepositoryManager
							repositories={repositories}
							selectedRepositoryId={selectedRepositoryId!}
							onSelectRepository={setSelectedRepository}
						/>
					</div>

					<div className="lg:col-span-3">
						<div className="mb-8">
							<h2 className="mb-4 text-xl font-semibold text-foreground">
								Repository Overview
							</h2>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<Card className="lg:col-span-1 lg:row-span-2">
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-sm font-medium">
											<Activity className="h-4 w-4 text-chart-1" />
											Health Score
										</CardTitle>
									</CardHeader>
									<CardContent className="flex flex-col items-center justify-center py-8">
										<div
											className={`text-5xl font-bold ${getHealthScoreColor(data.repositoryHealth?.healthScore || 0)}`}
										>
											{data.repositoryHealth
												?.healthScore || 0}
										</div>
										<p className="mt-2 text-xs text-muted-foreground">
											out of 100
										</p>
										<div className="mt-6 w-full space-y-2">
											<div className="flex justify-between text-xs">
												<span className="text-muted-foreground">
													Quality
												</span>
												<span className="font-medium">
													{data.repositoryHealth
														?.testCoverage || 0}
													%
												</span>
											</div>
											<div className="h-2 w-full rounded-full bg-border">
												<div
													className="h-full rounded-full bg-chart-1"
													style={{
														width: `${data.repositoryHealth?.testCoverage || 0}%`,
													}}
												/>
											</div>
										</div>
									</CardContent>
								</Card>

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
											<Zap className="h-4 w-4 text-chart-2" />
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

								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="text-sm font-medium">
											Open Issues
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-3xl font-bold text-orange-600">
											{data.repositoryHealth
												?.openIssues || 0}
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											to resolve
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
											{data.repositoryHealth?.stalePrs ||
												0}
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											awaiting review
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
										<p className="text-3xl font-bold text-blue-600">
											{data.repositoryHealth
												?.avgReviewTime || 0}
											h
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											per PR
										</p>
									</CardContent>
								</Card>
							</div>
						</div>

						<div className="mb-8 grid gap-6 lg:grid-cols-2">
							<CommitPRChart commitPRData={data.commitPRData} />

							<SuccessRateChart
								buildTrendData={data.buildTrendData}
							/>
						</div>

						<CommitsCard commits={data.recentCommits} />

						<PRCard prs={data.recentPullRequests} />

						<ContributorsCard contributors={data.topContributors} />

						<DeploymentsCard deployments={data.recentDeploys} />

						<Card>
							<CardHeader>
								<CardTitle>Key Insights</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
									<p className="font-medium">Analysis:</p>
									<p className="mt-2">{data.insight}</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</main>
	);
}
