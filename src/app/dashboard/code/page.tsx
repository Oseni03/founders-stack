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
	GitMerge,
	TrendingUp,
	Users,
	Activity,
} from "lucide-react";
import { ChartWidget } from "@/components/widgets/chart-widget";
import { useCodeStore } from "@/zustand/providers/code-store-provider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter } from "next/navigation";
import { RepoData } from "@/lib/connectors/github";
import { saveRepositories } from "@/server/code";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";

interface PRStatus {
	open: number;
	merged: number;
	draft: number;
}

interface RepoHealth {
	score: number;
	openIssues: number;
	stalePRs: number;
	codeReviewTime: string;
	testCoverage: number;
}

export default function CodePage() {
	const { activeOrganization } = useOrganizationStore((state) => state);
	const {
		branches,
		commits,
		repositories,
		contributors,
		pullRequests,
		issues,
		loading: {
			repositories: repoLoading,
			branches: branchesLoading,
			commits: commitsLoading,
			contributors: contributorsLoading,
			pullRequests: prLoading,
			issues: issuesLoading,
		},
		error: {
			repositories: repoError,
			branches: branchesError,
			commits: commitsError,
			contributors: contributorsError,
			pullRequests: prError,
			issues: issuesError,
		},
		fetchRepositories,
		fetchBranches,
		fetchCommits,
		fetchContributors,
		fetchPullRequests,
		fetchIssues,
	} = useCodeStore((state) => state);
	const [selectedRepoId, setSelectedRepoId] = useState<string>("");
	const [prStatus, setPRStatus] = useState<PRStatus | null>(null);
	const [repoHealth, setRepoHealth] = useState<RepoHealth | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [open, setOpen] = useState(false);
	const [githubRepos, setGithubRepos] = useState<RepoData[]>([]);
	const [selectedRepos, setSelectedRepos] = useState<RepoData[]>([]);
	const [repoFetchLoading, setRepoFetchLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const searchParams = useSearchParams();
	const router = useRouter();

	useEffect(() => {
		const addRepo = searchParams.get("addRepo");
		if (addRepo === "true") {
			setOpen(true);
			router.replace("/code"); // Assuming the page path is /code. Adjust if different.
		}
	}, [searchParams, router]);

	useEffect(() => {
		const fetchAllData = async () => {
			setIsLoading(true);
			try {
				// Select the first repo by default or use a specific one
				if (repositories.length === 0) {
					toast.info("No repositories found", {
						description: "Kindly integrate and add a repository",
					});
					return;
				}

				const initialRepoId = repositories[0].id;
				setSelectedRepoId(initialRepoId);

				// Fetch data for the selected repo
				await Promise.all([
					fetchBranches(initialRepoId),
					fetchCommits(initialRepoId),
					fetchContributors(initialRepoId),
					fetchIssues(initialRepoId),
					fetchPullRequests(initialRepoId),
				]);

				// Derive PRStatus from pullRequests
				const filteredPRs = pullRequests.filter(
					(pr) => pr.repositoryId === initialRepoId
				);
				const open = filteredPRs.filter(
					(pr) => pr.status === "open"
				).length;
				const merged = filteredPRs.filter(
					(pr) => pr.status === "merged"
				).length;
				const draft = filteredPRs.filter(
					(pr) => pr.status === "draft"
				).length;
				setPRStatus({ open, merged, draft });

				// Derive RepoHealth
				const filteredIssues = issues.filter(
					(issue) => issue.repositoryId === initialRepoId
				);
				const filteredStalePRs = filteredPRs.filter(
					(pr) =>
						pr.status === "open" &&
						Date.now() - new Date(pr.createdAt).getTime() >
							30 * 24 * 60 * 60 * 1000
				);
				const avgReviewTime =
					filteredPRs.reduce(
						(sum, pr) => sum + (pr.avgReviewTime || 0),
						0
					) / (filteredPRs.length || 1);
				const openIssues = filteredIssues.filter(
					(issue) => issue.status === "open"
				).length;
				const stalePRs = filteredStalePRs.length;
				const score = Math.max(
					0,
					100 -
						openIssues * 2 -
						stalePRs * 5 -
						(avgReviewTime > 24 ? 10 : 0)
				);
				setRepoHealth({
					score: Math.round(score),
					openIssues,
					stalePRs,
					codeReviewTime: `${avgReviewTime.toFixed(1)} hours`,
					testCoverage: 0, // Placeholder; fetch from API if available
				});
			} catch (error) {
				console.error("[v0] Failed to fetch code data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchAllData();
	}, [
		fetchBranches,
		fetchCommits,
		fetchContributors,
		fetchIssues,
		fetchPullRequests,
		pullRequests,
		issues,
		repositories,
	]);

	const handleRepoChange = async (repoId: string) => {
		setSelectedRepoId(repoId);
		setIsLoading(true);
		try {
			await Promise.all([
				fetchBranches(repoId),
				fetchCommits(repoId),
				fetchContributors(repoId),
				fetchIssues(repoId),
				fetchPullRequests(repoId),
			]);

			const filteredPRs = pullRequests.filter(
				(pr) => pr.repositoryId === repoId
			);
			const open = filteredPRs.filter(
				(pr) => pr.status === "open"
			).length;
			const merged = filteredPRs.filter(
				(pr) => pr.status === "merged"
			).length;
			const draft = filteredPRs.filter(
				(pr) => pr.status === "draft"
			).length;
			setPRStatus({ open, merged, draft });

			const filteredIssues = issues.filter(
				(issue) => issue.repositoryId === repoId
			);
			const filteredStalePRs = filteredPRs.filter(
				(pr) =>
					pr.status === "open" &&
					Date.now() - new Date(pr.createdAt).getTime() >
						30 * 24 * 60 * 60 * 1000
			);
			const avgReviewTime =
				filteredPRs.reduce(
					(sum, pr) => sum + (pr.avgReviewTime || 0),
					0
				) / (filteredPRs.length || 1);
			const openIssues = filteredIssues.filter(
				(issue) => issue.status === "open"
			).length;
			const stalePRs = filteredStalePRs.length;
			const score = Math.max(
				0,
				100 -
					openIssues * 2 -
					stalePRs * 5 -
					(avgReviewTime > 24 ? 10 : 0)
			);
			setRepoHealth({
				score: Math.round(score),
				openIssues,
				stalePRs,
				codeReviewTime: `${avgReviewTime.toFixed(1)} hours`,
				testCoverage: 0,
			});
		} catch (error) {
			console.error(
				"[v0] Failed to fetch data for selected repo:",
				error
			);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchGithubRepos = async () => {
		setRepoFetchLoading(true);
		try {
			const res = await fetch("/api/integrations/github/repos");
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(
					errorData.error || "Failed to fetch repositories"
				);
			}
			const data = await res.json();
			setGithubRepos(data);
		} catch (error) {
			toast.error("Failed to fetch your GitHub repositories");
			console.error("[FETCH_GITHUB_REPOS]", error);
		} finally {
			setRepoFetchLoading(false);
		}
	};

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (isOpen) {
			fetchGithubRepos();
			setSelectedRepos([]);
			setSearchTerm("");
		}
	};

	const handleSelectRepo = (repo: RepoData) => {
		setSelectedRepos((prev) =>
			prev.some((r) => r.externalId === repo.externalId)
				? prev.filter((r) => r.externalId !== repo.externalId)
				: [...prev, repo]
		);
	};

	const handleSaveRepos = async () => {
		if (selectedRepos.length === 0) return;
		if (!activeOrganization) return;

		console.log("Selected repos to save: ", selectedRepos);

		try {
			const repoIds = selectedRepos.map((r) => r.externalId);
			await saveRepositories(activeOrganization.id, selectedRepos);
			await fetchRepositories(); // Refresh the repositories in store
			setOpen(false);
			toast.success("Repositories added successfully");
			// Optionally set selectedRepoId to the first new repo
			const newRepo = repositories.find((repo) =>
				repoIds.includes(repo.externalId)
			);
			if (newRepo) {
				setSelectedRepoId(newRepo.id);
				handleRepoChange(newRepo.id);
			}
		} catch (error) {
			toast.error("Failed to save repositories");
			console.error("[SAVE_REPOS]", error);
		}
	};

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

	const isAnyLoading =
		repoLoading ||
		branchesLoading ||
		commitsLoading ||
		contributorsLoading ||
		issuesLoading ||
		prLoading ||
		isLoading;
	const hasAnyError =
		repoError ||
		branchesError ||
		commitsError ||
		contributorsError ||
		issuesError ||
		prError;

	const filteredRepos = githubRepos.filter((repo) =>
		repo.fullName.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="space-y-6">
			{/* Header with Repository Selector */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Code Activity
				</h1>
				<p className="text-muted-foreground mt-1">
					Monitor commits, PRs, and repository health across all
					projects
				</p>
				<div className="flex mt-4">
					<Select
						onValueChange={handleRepoChange}
						value={selectedRepoId}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select Repository" />
						</SelectTrigger>
						<SelectContent>
							{repositories.map((repo) => (
								<SelectItem key={repo.id} value={repo.id}>
									{repo.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Dialog open={open} onOpenChange={handleOpenChange}>
						<DialogTrigger asChild>
							<Button>Add repository</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>
									Select GitHub Repositories
								</DialogTitle>
							</DialogHeader>
							<Input
								placeholder="Search repositories..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="mb-4"
							/>
							{repoFetchLoading ? (
								<div className="space-y-2">
									{[1, 2, 3, 4, 5].map((i) => (
										<Skeleton
											key={i}
											className="h-10 w-full"
										/>
									))}
								</div>
							) : (
								<ScrollArea className="h-[300px] pr-4">
									{filteredRepos.length === 0 ? (
										<p className="text-center text-sm text-muted-foreground">
											No repositories found.
										</p>
									) : (
										filteredRepos.map((repo) => (
											<div
												key={repo.externalId}
												className="flex items-center space-x-2 py-2"
											>
												<Checkbox
													id={`repo-${repo.externalId}`}
													checked={selectedRepos.some(
														(r) =>
															r.externalId ===
															repo.externalId
													)}
													onCheckedChange={() =>
														handleSelectRepo(repo)
													}
												/>
												<label
													htmlFor={`repo-${repo.externalId}`}
													className="text-sm flex-1 cursor-pointer"
												>
													{repo.fullName}
												</label>
											</div>
										))
									)}
								</ScrollArea>
							)}
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setOpen(false)}
								>
									Cancel
								</Button>
								<Button
									onClick={handleSaveRepos}
									disabled={
										selectedRepos.length === 0 ||
										repoFetchLoading
									}
								>
									Save Selected ({selectedRepos.length})
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* PR Status Overview */}
			<div className="grid gap-4 md:grid-cols-3">
				{isAnyLoading ? (
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
									<GitMerge className="h-4 w-4 text-green-500" />
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
				endpoint={`/api/code/commit-activity?repoId=${selectedRepoId}`} // Adjust endpoint to accept repoId
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
						{contributorsLoading || isLoading ? (
							<div className="space-y-4">
								{[1, 2, 3, 4, 5].map((i) => (
									<Skeleton key={i} className="h-16" />
								))}
							</div>
						) : (
							<div className="space-y-4">
								{contributors
									.filter(
										(c) => c.repositoryId === selectedRepoId
									)
									.map((contributor, index) => (
										<div
											key={contributor.id}
											className="flex items-center gap-4"
										>
											<div className="flex items-center gap-3 flex-1">
												<div className="text-sm font-medium text-muted-foreground w-6">
													{index + 1}
												</div>
												<Avatar className="h-10 w-10">
													<AvatarImage
														src={
															contributor
																.attributes
																.avatarUrl ||
															"/placeholder.svg"
														}
														alt={contributor.login}
													/>
													<AvatarFallback>
														{contributor.login
															.slice(0, 2)
															.toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="flex-1">
													<div className="font-medium">
														{contributor.login}
													</div>
													<div className="text-xs text-muted-foreground">
														{
															contributor.contributions
														}{" "}
														commits
													</div>
												</div>
											</div>
											<div className="text-right text-xs text-muted-foreground">
												<div className="text-green-500">
													+
													{contributor.attributes.additions?.toLocaleString() ||
														0}
												</div>
												<div className="text-red-500">
													-
													{contributor.attributes.deletions?.toLocaleString() ||
														0}
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
						{issuesLoading || prLoading || isLoading ? (
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
					{commitsLoading || isLoading ? (
						<div className="space-y-4">
							{[1, 2, 3, 4, 5].map((i) => (
								<Skeleton key={i} className="h-20" />
							))}
						</div>
					) : (
						<div className="space-y-4">
							{commits
								.filter(
									(c) => c.repositoryId === selectedRepoId
								)
								.map((commit) => (
									<a
										key={commit.id}
										href={commit.attributes.url || "#"}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
									>
										<Avatar className="h-10 w-10 mt-1">
											<AvatarImage
												src={
													commit.attributes
														.avatarUrl ||
													"/placeholder.svg"
												}
												alt={
													commit.authorId || "Author"
												}
											/>
											<AvatarFallback>
												{commit.authorId
													?.slice(0, 2)
													.toUpperCase() || "AU"}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<div className="font-medium text-sm">
												{commit.message}
											</div>
											<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
												<span>{commit.authorId}</span>
												<span>•</span>
												<span>
													{commit.committedAt.toLocaleString()}
												</span>
												<span>•</span>
												<Badge
													variant="outline"
													className="text-xs"
												>
													{commit.repositoryId}
												</Badge>
												<span>•</span>
												<span className="flex items-center gap-1">
													<GitBranch className="h-3 w-3" />
													{commit.attributes.branch ||
														"main"}
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
					{branchesLoading || isLoading ? (
						<div className="space-y-3">
							{[1, 2, 3, 4, 5].map((i) => (
								<Skeleton key={i} className="h-16" />
							))}
						</div>
					) : (
						<div className="space-y-3">
							{branches
								.filter(
									(b) => b.repositoryId === selectedRepoId
								)
								.map((branch) => (
									<div
										key={branch.id}
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
													Last commit{" "}
													{branch.lastCommitAt?.toLocaleString() ||
														"N/A"}
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
