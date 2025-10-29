/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	GitBranch,
	CheckCircle2,
	AlertCircle,
	Zap,
	GitCommit,
	GitPullRequest,
	Users,
	Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	BarChart,
	Bar,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { RepositoryManager } from "@/components/dashboard/repository-manager";
import { useCodeStore } from "@/zustand/providers/code-store-provider";
import Image from "next/image";
import { CodeCIMetrics, Repository } from "@/types/code";

/**
 * Code/CI Detail Page
 * Comprehensive view of build status, commits, PRs, contributors, and repository health
 */
export default function CodeCIPage() {
	const repositories = useCodeStore((state) => state.repositories);
	const selectedRepositoryId = useCodeStore(
		(state) => state.selectedRepositoryId
	);
	const data = useCodeStore((state) => state.data);
	const loading = useCodeStore((state) => state.loading);
	const setLoading = useCodeStore((state) => state.setLoading);
	const setData = useCodeStore((state) => state.setData);
	const setError = useCodeStore((state) => state.setError);
	const error = useCodeStore((state) => state.error);
	const setSelectedRepository = useCodeStore(
		(state) => state.setSelectedRepository
	);
	const setRepositories = useCodeStore((state) => state.setRepositories);
	const addRepository = useCodeStore((state) => state.addRepository);
	const deleteRepository = useCodeStore((state) => state.deleteRepository);

	/* -------------------------------------------------
	 *  1. Load *all* connected repositories (once)
	 * ------------------------------------------------- */
	const fetchRepositories = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/code-ci/repositories");
			if (!res.ok) throw new Error("Failed to fetch repositories");
			const repos: Repository[] = await res.json();
			setRepositories(repos);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}, [setLoading, setError, setRepositories]);

	const fetchRepoData = useCallback(
		async (repoId: string) => {
			setLoading(true);
			setError(null);
			try {
				const url = `/api/code-ci?repositoryId=${repoId}`;
				console.log("Fetching from:", url);
				const res = await fetch(url);
				console.log("Response status:", res.status);

				if (!res.ok) {
					const txt = await res.text();
					console.error("Fetch failed:", txt);
					throw new Error(txt || `HTTP ${res.status}`);
				}
				const payload: CodeCIMetrics = await res.json();
				setData(payload);
				console.log("Data set successfully");
			} catch (err: any) {
				console.error("Error in fetchRepoData:", err);
				setError(err.message);
				setData(null);
			} finally {
				setLoading(false);
				console.log("Loading set to false");
			}
		},
		[setLoading, setError, setData]
	);

	/* 1. Load repos on mount */
	useEffect(() => {
		fetchRepositories();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	/* 2. Auto-select first repo after repos are loaded */
	useEffect(() => {
		console.log("Effect 2 - Auto-select:", {
			selectedRepositoryId,
			repositoriesLength: repositories.length,
		});
		if (!selectedRepositoryId && repositories.length > 0) {
			console.log("Auto-selecting first repository:", repositories[0].id);
			setSelectedRepository(repositories[0].id);
		}
	}, [repositories, selectedRepositoryId, setSelectedRepository]);

	/* 3. Fetch repo data when a repo is selected - SINGLE useEffect */
	useEffect(() => {
		console.log("Effect 3 - Fetch data:", { selectedRepositoryId });
		if (selectedRepositoryId) {
			console.log("Calling fetchRepoData for:", selectedRepositoryId);
			fetchRepoData(selectedRepositoryId);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedRepositoryId]);

	const handleAddRepository = (
		name: string,
		owner: string,
		language: string
	) => {
		const newRepo = {
			id: `repo-${Date.now()}`,
			name,
			owner,
			language,
			isPrivate: false,
		};
		addRepository(newRepo);
	};

	const handleDeleteRepository = (id: string) => {
		deleteRepository(id);
	};

	// Add console logs to debug
	console.log("State:", {
		loading,
		error,
		repositoriesLength: repositories.length,
		hasData: !!data,
		selectedRepositoryId,
	});

	// 1️⃣ If error (check this first), show error message
	if (error && !loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="mb-4 text-lg font-semibold text-destructive">
						{error}
					</p>
					<Link href="/dashboard">
						<Button>Back to Dashboard</Button>
					</Link>
				</div>
			</div>
		);
	}

	// 2️⃣ If no repositories and not loading
	if (!loading && repositories.length === 0) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center text-muted-foreground">
					No repositories found. Please add a repository.
				</div>
			</div>
		);
	}

	// 3️⃣ If loading OR if we have repositories but no data yet
	if (loading || (repositories.length > 0 && !data)) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
					<p className="text-muted-foreground">
						{!data && repositories.length > 0
							? "Loading repository data..."
							: "Loading code metrics..."}
					</p>
				</div>
			</div>
		);
	}

	// 4️⃣ Final safeguard - shouldn't reach here without data
	if (!data) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center text-muted-foreground">
					<p className="mb-4">Unable to load repository data.</p>
					<Button
						onClick={() =>
							selectedRepositoryId &&
							fetchRepoData(selectedRepositoryId)
						}
					>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	const buildStatusColor =
		data.buildStatus === "success"
			? "text-green-500"
			: data.buildStatus === "failed"
				? "text-red-500"
				: "text-yellow-500";

	// Generate trend data (can be moved to API later)
	const commitPRData = Array.from({ length: 7 }, (_, i) => ({
		name: `Day ${i + 1}`,
		commits: Math.floor(Math.random() * 20) + 5,
		prs: Math.floor(Math.random() * 8) + 2,
	}));

	// Generate deployment timeline
	const deploymentTimeline = data.recentDeploys.map((deploy: any) => ({
		id: deploy.id,
		environment: deploy.environment,
		status: deploy.status,
		timestamp: new Date(deploy.timestamp).toLocaleDateString(),
		time: new Date(deploy.timestamp).toLocaleTimeString(),
	}));

	// Generate build success rate trend
	const buildTrendData = Array.from({ length: 14 }, (_, i) => ({
		name: `Day ${i + 1}`,
		successRate: Math.round(data.buildSuccessRate - Math.random() * 10 + 5),
	}));

	const getStatusColor = (status: string) => {
		switch (status) {
			case "success":
				return "bg-green-100 text-green-700";
			case "failed":
				return "bg-red-100 text-red-700";
			case "merged":
				return "bg-purple-100 text-purple-700";
			case "open":
				return "bg-blue-100 text-blue-700";
			case "draft":
				return "bg-gray-100 text-gray-700";
			default:
				return "bg-yellow-100 text-yellow-700";
		}
	};

	const getHealthScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		return "text-red-600";
	};

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header with Back Button */}
				<div className="mb-8 flex items-center gap-4">
					<Link href="/dashboard">
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
							onAddRepository={handleAddRepository}
							onDeleteRepository={handleDeleteRepository}
						/>
					</div>

					<div className="lg:col-span-3">
						<div className="mb-8">
							<h2 className="mb-4 text-xl font-semibold text-foreground">
								Repository Overview
							</h2>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								{/* Health Score - Large Primary Card */}
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

								{/* Commits */}
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

								{/* Pull Requests */}
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

								{/* Build Status */}
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

								{/* Success Rate */}
								<Card>
									<CardHeader className="pb-3">
										<CardTitle className="flex items-center gap-2 text-sm font-medium">
											<AlertCircle className="h-4 w-4 text-chart-4" />
											Success Rate
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-3xl font-bold">
											{data.buildSuccessRate.toFixed(1)}%
										</p>
										<p className="mt-1 text-xs text-muted-foreground">
											Build success
										</p>
									</CardContent>
								</Card>

								{/* Open Issues */}
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

								{/* Stale PRs */}
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

								{/* Avg Review Time */}
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

						{/* Charts Grid */}
						<div className="mb-8 grid gap-6 lg:grid-cols-2">
							{/* Commits & PRs */}
							<Card>
								<CardHeader>
									<CardTitle>
										Commits & Pull Requests
									</CardTitle>
									<CardDescription>
										Development activity over the last 7
										days
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="h-80 w-full">
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<BarChart data={commitPRData}>
												<CartesianGrid
													strokeDasharray="3 3"
													stroke="var(--border)"
												/>
												<XAxis
													dataKey="name"
													stroke="var(--muted-foreground)"
												/>
												<YAxis stroke="var(--muted-foreground)" />
												<Tooltip
													contentStyle={{
														backgroundColor:
															"var(--card)",
														border: "1px solid var(--border)",
														borderRadius:
															"var(--radius)",
													}}
												/>
												<Bar
													dataKey="commits"
													fill="var(--chart-1)"
													name="Commits"
												/>
												<Bar
													dataKey="prs"
													fill="var(--chart-3)"
													name="PRs"
												/>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</CardContent>
							</Card>

							{/* Build Success Rate Trend */}
							<Card>
								<CardHeader>
									<CardTitle>
										Build Success Rate Trend
									</CardTitle>
									<CardDescription>
										Build success rate over the last 14 days
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="h-80 w-full">
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<LineChart data={buildTrendData}>
												<CartesianGrid
													strokeDasharray="3 3"
													stroke="var(--border)"
												/>
												<XAxis
													dataKey="name"
													stroke="var(--muted-foreground)"
													style={{ fontSize: "12px" }}
												/>
												<YAxis
													stroke="var(--muted-foreground)"
													domain={[0, 100]}
												/>
												<Tooltip
													contentStyle={{
														backgroundColor:
															"var(--card)",
														border: "1px solid var(--border)",
														borderRadius:
															"var(--radius)",
													}}
													formatter={(value) =>
														`${value}%`
													}
												/>
												<Line
													type="monotone"
													dataKey="successRate"
													stroke="var(--chart-1)"
													strokeWidth={2}
													dot={{
														fill: "var(--chart-1)",
													}}
												/>
											</LineChart>
										</ResponsiveContainer>
									</div>
								</CardContent>
							</Card>
						</div>

						<Card className="mb-8">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<GitCommit className="h-5 w-5" />
									Recent Commits
								</CardTitle>
								<CardDescription>
									Latest commits to the repository
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{data.recentCommits
										?.slice(0, 8)
										.map((commit: any) => (
											<div
												key={commit.id}
												className="flex items-start justify-between rounded-lg border border-border p-4"
											>
												<div className="flex-1">
													<div className="flex items-center gap-3">
														<Image
															src={
																commit.avatarUrl ||
																"/placeholder.svg"
															}
															alt={
																commit.authorName
															}
															className="h-8 w-8 rounded-full"
															width={32}
															height={32}
														/>
														<div>
															<p className="font-medium text-foreground">
																{commit.message}
															</p>
															<p className="text-xs text-muted-foreground">
																by{" "}
																{
																	commit.authorName
																}{" "}
																on{" "}
																{new Date(
																	commit.committedAt
																).toLocaleDateString()}
															</p>
														</div>
													</div>
												</div>
												<div className="ml-4 flex items-center gap-2 text-xs">
													<span className="rounded bg-green-100 px-2 py-1 text-green-700">
														+{commit.additions}
													</span>
													<span className="rounded bg-red-100 px-2 py-1 text-red-700">
														-{commit.deletions}
													</span>
												</div>
											</div>
										))}
								</div>
							</CardContent>
						</Card>

						<Card className="mb-8">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<GitPullRequest className="h-5 w-5" />
									Pull Requests
								</CardTitle>
								<CardDescription>
									Recent pull requests and their status
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{data.recentPullRequests
										?.slice(0, 8)
										.map((pr: any) => (
											<div
												key={pr.id}
												className="flex items-center justify-between rounded-lg border border-border p-4"
											>
												<div className="flex-1">
													<div className="flex items-center gap-3">
														<Image
															src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${pr.authorName}`}
															alt={pr.authorName}
															className="h-8 w-8 rounded-full"
															width={32}
															height={32}
														/>
														<div>
															<p className="font-medium text-foreground">
																#{pr.number}{" "}
																{pr.title}
															</p>
															<p className="text-xs text-muted-foreground">
																by{" "}
																{pr.authorName}{" "}
																•{" "}
																{
																	pr.reviewerCount
																}{" "}
																reviewer
																{pr.reviewerCount !==
																1
																	? "s"
																	: ""}{" "}
																•{" "}
																{
																	pr.avgReviewTime
																}
																h avg review
																time
															</p>
														</div>
													</div>
												</div>
												<span
													className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(pr.status)}`}
												>
													{pr.status
														.charAt(0)
														.toUpperCase() +
														pr.status.slice(1)}
												</span>
											</div>
										))}
								</div>
							</CardContent>
						</Card>

						<Card className="mb-8">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Top Contributors
								</CardTitle>
								<CardDescription>
									Most active contributors this period
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{data.topContributors?.map(
										(contributor: any, index: number) => (
											<div
												key={contributor.login}
												className="flex items-center justify-between rounded-lg border border-border p-4"
											>
												<div className="flex items-center gap-3">
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
														{index + 1}
													</div>
													<Image
														src={
															contributor.avatarUrl ||
															"/placeholder.svg"
														}
														alt={contributor.name}
														className="h-8 w-8 rounded-full"
														width={32}
														height={32}
													/>
													<div>
														<p className="font-medium text-foreground">
															{contributor.name}
														</p>
														<p className="text-xs text-muted-foreground">
															@{contributor.login}
														</p>
													</div>
												</div>
												<div className="text-right">
													<p className="font-semibold text-foreground">
														{
															contributor.contributions
														}
													</p>
													<p className="text-xs text-muted-foreground">
														contributions
													</p>
												</div>
											</div>
										)
									)}
								</div>
							</CardContent>
						</Card>

						{/* Recent Deployments */}
						<Card className="mb-8">
							<CardHeader>
								<CardTitle>Recent Deployments</CardTitle>
								<CardDescription>
									Latest deployment activity
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{deploymentTimeline.map((deploy: any) => (
										<div
											key={deploy.id}
											className="flex items-center justify-between rounded-lg border border-border p-4"
										>
											<div className="flex-1">
												<p className="font-medium text-foreground capitalize">
													{deploy.environment}
												</p>
												<p className="text-sm text-muted-foreground">
													{deploy.timestamp} at{" "}
													{deploy.time}
												</p>
											</div>
											<span
												className={`rounded-full px-3 py-1 text-xs font-semibold ${
													deploy.status === "success"
														? "bg-green-100 text-green-700"
														: deploy.status ===
															  "failed"
															? "bg-red-100 text-red-700"
															: "bg-yellow-100 text-yellow-700"
												}`}
											>
												{deploy.status
													.charAt(0)
													.toUpperCase() +
													deploy.status.slice(1)}
											</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Insights */}
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
