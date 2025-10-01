"use client";

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	GitBranch,
	GitCommit,
	GitPullRequest,
	TrendingUp,
	Users,
	Activity,
} from "lucide-react";
import { ChartWidget } from "@/components/widgets/chart-widget";

interface PRStatus {
	open: number;
	merged: number;
	draft: number;
}

interface Contributor {
	name: string;
	avatar: string;
	commits: number;
	additions: number;
	deletions: number;
}

interface RepoHealth {
	score: number;
	openIssues: number;
	stalePRs: number;
	codeReviewTime: string;
	testCoverage: number;
}

interface Commit {
	id: string;
	message: string;
	author: string;
	avatar: string;
	timestamp: string;
	repo: string;
	branch: string;
	url: string;
}

interface Branch {
	name: string;
	lastCommit: string;
	commitsAhead: number;
	status: "active" | "stale" | "merged";
}

export default function CodePage() {
	const [prStatus, setPRStatus] = useState<PRStatus | null>(null);
	const [contributors, setContributors] = useState<Contributor[]>([]);
	const [repoHealth, setRepoHealth] = useState<RepoHealth | null>(null);
	const [recentCommits, setRecentCommits] = useState<Commit[]>([]);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [
					prRes,
					contributorsRes,
					healthRes,
					commitsRes,
					branchesRes,
				] = await Promise.all([
					fetch("/api/code/pr-status"),
					fetch("/api/code/contributors"),
					fetch("/api/code/repo-health"),
					fetch("/api/code/recent-commits"),
					fetch("/api/code/branches"),
				]);

				const [
					prData,
					contributorsData,
					healthData,
					commitsData,
					branchesData,
				] = await Promise.all([
					prRes.json(),
					contributorsRes.json(),
					healthRes.json(),
					commitsRes.json(),
					branchesRes.json(),
				]);

				setPRStatus(prData);
				setContributors(contributorsData.contributors);
				setRepoHealth(healthData);
				setRecentCommits(commitsData.commits);
				setBranches(branchesData.branches);
			} catch (error) {
				console.error("[v0] Failed to fetch code data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	const getHealthColor = (score: number) => {
		if (score >= 80) return "text-green-500";
		if (score >= 60) return "text-yellow-500";
		return "text-red-500";
	};

	const getBranchStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-500";
			case "stale":
				return "bg-yellow-500";
			case "merged":
				return "bg-gray-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Code Activity
				</h1>
				<p className="text-muted-foreground mt-1">
					Monitor commits, PRs, and repository health across all
					projects
				</p>
			</div>

			{/* PR Status Overview */}
			<div className="grid gap-4 md:grid-cols-3">
				{isLoading ? (
					<>
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
					</>
				) : (
					prStatus && (
						<>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Open PRs
									</CardTitle>
									<GitPullRequest className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{prStatus.open}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Awaiting review
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Merged PRs
									</CardTitle>
									<GitPullRequest className="h-4 w-4 text-green-500" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{prStatus.merged}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										This week
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Draft PRs
									</CardTitle>
									<GitPullRequest className="h-4 w-4 text-yellow-500" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{prStatus.draft}
									</div>
									<p className="text-xs text-muted-foreground mt-1">
										Work in progress
									</p>
								</CardContent>
							</Card>
						</>
					)
				)}
			</div>

			{/* Commit Activity Chart */}
			<ChartWidget
				title="Commit Activity"
				description="Daily commits across all repositories"
				endpoint="/api/code/commit-activity"
				chartType="bar"
				dataKeys={[
					{
						key: "commits",
						label: "Commits",
						color: "hsl(var(--primary))",
					},
				]}
				xAxisKey="date"
				icon={GitCommit}
				height={250}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Contributor Leaderboard */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Top Contributors
						</CardTitle>
						<CardDescription>
							Most active contributors this month
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-4">
								{[1, 2, 3, 4, 5].map((i) => (
									<Skeleton key={i} className="h-16" />
								))}
							</div>
						) : (
							<div className="space-y-4">
								{contributors.map((contributor, index) => (
									<div
										key={contributor.name}
										className="flex items-center gap-4"
									>
										<div className="flex items-center gap-3 flex-1">
											<div className="text-sm font-medium text-muted-foreground w-6">
												{index + 1}
											</div>
											<Avatar className="h-10 w-10">
												<AvatarImage
													src={
														contributor.avatar ||
														"/placeholder.svg"
													}
													alt={contributor.name}
												/>
												<AvatarFallback>
													{contributor.name
														.slice(0, 2)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<div className="font-medium">
													{contributor.name}
												</div>
												<div className="text-xs text-muted-foreground">
													{contributor.commits}{" "}
													commits
												</div>
											</div>
										</div>
										<div className="text-right text-xs text-muted-foreground">
											<div className="text-green-500">
												+
												{contributor.additions.toLocaleString()}
											</div>
											<div className="text-red-500">
												-
												{contributor.deletions.toLocaleString()}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Repository Health */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Repository Health
						</CardTitle>
						<CardDescription>
							Overall health metrics
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-4">
								<Skeleton className="h-20" />
								<Skeleton className="h-16" />
								<Skeleton className="h-16" />
								<Skeleton className="h-16" />
							</div>
						) : (
							repoHealth && (
								<div className="space-y-6">
									<div className="text-center">
										<div
											className={`text-5xl font-bold ${getHealthColor(repoHealth.score)}`}
										>
											{repoHealth.score}
										</div>
										<div className="text-sm text-muted-foreground mt-1">
											Health Score
										</div>
									</div>

									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-sm">
												Open Issues
											</span>
											<Badge variant="outline">
												{repoHealth.openIssues}
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">
												Stale PRs
											</span>
											<Badge variant="outline">
												{repoHealth.stalePRs}
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">
												Avg Review Time
											</span>
											<Badge variant="outline">
												{repoHealth.codeReviewTime}
											</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">
												Test Coverage
											</span>
											<Badge variant="outline">
												{repoHealth.testCoverage}%
											</Badge>
										</div>
									</div>
								</div>
							)
						)}
					</CardContent>
				</Card>
			</div>

			{/* Recent Commits Timeline */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<GitCommit className="h-5 w-5" />
						Recent Commits
					</CardTitle>
					<CardDescription>
						Latest commits across all repositories
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							{[1, 2, 3, 4, 5].map((i) => (
								<Skeleton key={i} className="h-20" />
							))}
						</div>
					) : (
						<div className="space-y-4">
							{recentCommits.map((commit) => (
								<a
									key={commit.id}
									href={commit.url}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
								>
									<Avatar className="h-10 w-10 mt-1">
										<AvatarImage
											src={
												commit.avatar ||
												"/placeholder.svg"
											}
											alt={commit.author}
										/>
										<AvatarFallback>
											{commit.author
												.slice(0, 2)
												.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm">
											{commit.message}
										</div>
										<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
											<span>{commit.author}</span>
											<span>•</span>
											<span>{commit.timestamp}</span>
											<span>•</span>
											<Badge
												variant="outline"
												className="text-xs"
											>
												{commit.repo}
											</Badge>
											<span>•</span>
											<span className="flex items-center gap-1">
												<GitBranch className="h-3 w-3" />
												{commit.branch}
											</span>
										</div>
									</div>
								</a>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Branch Activity */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<GitBranch className="h-5 w-5" />
						Branch Activity
					</CardTitle>
					<CardDescription>
						Active branches across repositories
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-3">
							{[1, 2, 3, 4, 5].map((i) => (
								<Skeleton key={i} className="h-16" />
							))}
						</div>
					) : (
						<div className="space-y-3">
							{branches.map((branch) => (
								<div
									key={branch.name}
									className="flex items-center justify-between p-3 rounded-lg border"
								>
									<div className="flex items-center gap-3">
										<div
											className={`h-2 w-2 rounded-full ${getBranchStatusColor(branch.status)}`}
										/>
										<div>
											<div className="font-medium text-sm">
												{branch.name}
											</div>
											<div className="text-xs text-muted-foreground">
												Last commit {branch.lastCommit}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										{branch.commitsAhead > 0 && (
											<Badge
												variant="secondary"
												className="text-xs"
											>
												<TrendingUp className="h-3 w-3 mr-1" />
												{branch.commitsAhead} ahead
											</Badge>
										)}
										<Badge
											variant="outline"
											className="text-xs capitalize"
										>
											{branch.status}
										</Badge>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
