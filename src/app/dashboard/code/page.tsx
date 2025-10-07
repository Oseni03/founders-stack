"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCodeStore } from "@/zustand/providers/code-store-provider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CommitActivityChart } from "@/components/charts/commits-activity-chart";
import { GitHubRepoSelection } from "@/components/code/github-repo-selection";
import { PRCard } from "@/components/code/pr-card";
import { ContributorsCard } from "@/components/code/contributors-card";
import { RepositoryHealthCard } from "@/components/code/repository-health-card";
import { CommitsCard } from "@/components/code/commits-card";
import { BranchActivityCard } from "@/components/code/branch-activity-card";

export default function CodePage() {
	const {
		activeRepoId,
		repoHealth,
		prStatus,
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
		error: { commits: commitsError },
		setActiveRepoId,
		setPRStatus,
		setRepoHealth,
		fetchRepositories,
		fetchBranches,
		fetchCommits,
		fetchContributors,
		fetchPullRequests,
		fetchIssues,
	} = useCodeStore((state) => state);
	const [isLoading, setIsLoading] = useState(true);

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
				setActiveRepoId(initialRepoId);

				await Promise.all([
					fetchBranches(initialRepoId),
					fetchCommits(initialRepoId),
					fetchContributors(initialRepoId),
					fetchIssues(initialRepoId),
					fetchPullRequests(initialRepoId),
				]);

				// Derive PRStatus (unchanged)
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

				// Derive RepoHealth (unchanged)
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
					testCoverage: 0, // TODO: Integrate real coverage from GitHub API if needed
				});
			} catch (error) {
				console.error("[CODE_PAGE_FETCH]", error);
				toast.error("Failed to load code data");
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
		setActiveRepoId,
		setPRStatus,
		setRepoHealth,
	]);

	const handleRepoChange = async (repoId: string) => {
		setActiveRepoId(repoId);
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

	const isAnyLoading =
		repoLoading ||
		branchesLoading ||
		commitsLoading ||
		contributorsLoading ||
		issuesLoading ||
		prLoading ||
		isLoading;

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
				<div className="flex mt-4 gap-2">
					<Select
						onValueChange={handleRepoChange}
						value={activeRepoId}
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
					<GitHubRepoSelection
						repositories={repositories}
						onSuccess={fetchRepositories}
						onRepoChange={handleRepoChange}
					/>
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
					prStatus && <PRCard prStatus={prStatus} />
				)}
			</div>

			{/* Commit Activity Chart */}
			<CommitActivityChart
				commits={commits}
				selectedRepoId={activeRepoId}
				isLoading={isAnyLoading}
				error={commitsError}
			/>

			{/* Rest of the JSX (Contributor Leaderboard, Repository Health, Recent Commits, Branch Activity) unchanged */}
			<div className="grid gap-6 lg:grid-cols-2">
				<ContributorsCard
					contributors={contributors}
					isLoading={contributorsLoading || isLoading}
					selectedRepoId={activeRepoId}
				/>

				<RepositoryHealthCard
					isLoading={issuesLoading || prLoading || isLoading}
					repoHealth={repoHealth}
				/>
			</div>

			<CommitsCard
				isLoading={commitsLoading || isLoading}
				selectedRepoId={activeRepoId}
				commits={commits}
			/>

			<BranchActivityCard
				isLoading={branchesLoading || isLoading}
				selectedRepoId={activeRepoId}
				branches={branches}
			/>
		</div>
	);
}
