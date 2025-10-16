"use client";

import { useEffect, useCallback } from "react";
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
import { PRCard } from "@/components/code/pr-card";
import { ContributorsCard } from "@/components/code/contributors-card";
import { RepositoryHealthCard } from "@/components/code/repository-health-card";
import { CommitsCard } from "@/components/code/commits-card";
import { BranchActivityCard } from "@/components/code/branch-activity-card";
import { DeleteRepositoryDialog } from "@/components/code/delete-repository-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CodePage() {
	const {
		activeRepoId,
		repoHealth,
		prStatus,
		branches,
		commits,
		repositories,
		contributors,
		loading: {
			repositories: repoLoading,
			branches: branchesLoading,
			commits: commitsLoading,
			contributors: contributorsLoading,
			pullRequests: prLoading,
			issues: issuesLoading,
		},
		error,
		setActiveRepoId,
		deleteRepository,
	} = useCodeStore((state) => state);

	useEffect(() => {
		const initialize = async () => {
			if (repositories.length > 0 && !activeRepoId) {
				setActiveRepoId(repositories[0].id);
				// } else if (repositories.length > 0 && activeRepoId) {
				// 	await fetchData(activeRepoId);
			} else if (repositories.length === 0) {
				toast.info("No repositories found", {
					description: "Kindly integrate and add a repository",
				});
			}
		};
		initialize();
	}, [repositories, activeRepoId, setActiveRepoId]);

	const handleRepoChange = useCallback(
		async (repoId: string) => {
			setActiveRepoId(repoId);
		},
		[setActiveRepoId]
	);

	const handleDeleteRepository = useCallback(
		async (repoId: string) => {
			await deleteRepository(repoId);

			// If we deleted the active repo and there are repos left, load the first one
			if (repoId === activeRepoId && repositories.length > 1) {
				const newActiveRepo = repositories.find((r) => r.id !== repoId);
				if (newActiveRepo) {
					await handleRepoChange(newActiveRepo.id);
				}
			}
		},
		[deleteRepository, activeRepoId, repositories, handleRepoChange]
	);

	const activeRepository = repositories.find((r) => r.id === activeRepoId);

	if (error) {
		toast.error(error);
	}

	const isAnyLoading =
		repoLoading ||
		branchesLoading ||
		commitsLoading ||
		contributorsLoading ||
		issuesLoading ||
		prLoading;

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
					<Button asChild>
						<Link href="/dashboard/integrations/github/onboarding">
							Add repository
						</Link>
					</Button>
					{activeRepository && repositories.length > 0 && (
						<DeleteRepositoryDialog
							repository={activeRepository}
							onDelete={handleDeleteRepository}
							disabled={repositories.length === 1}
						/>
					)}
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
				error={error}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<ContributorsCard
					contributors={contributors}
					isLoading={isAnyLoading}
					selectedRepoId={activeRepoId}
				/>

				<RepositoryHealthCard
					isLoading={isAnyLoading}
					repoHealth={repoHealth}
				/>
			</div>

			<CommitsCard
				isLoading={isAnyLoading}
				selectedRepoId={activeRepoId}
				commits={commits}
			/>

			<BranchActivityCard
				isLoading={isAnyLoading}
				selectedRepoId={activeRepoId}
				branches={branches}
			/>
		</div>
	);
}
