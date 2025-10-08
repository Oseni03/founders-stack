"use client";

import React, { useEffect, useState, Suspense } from "react";
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
import { useSearchParams } from "next/navigation";
import { RepoData } from "@/lib/connectors/github";
import { toast } from "sonner";
import { saveRepositories } from "@/server/code";
import { z } from "zod";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { Skeleton } from "../ui/skeleton";
import { Repository } from "@prisma/client";

// Separate component that uses useSearchParams
function RepoDialogContent({
	repositories,
	onSuccess,
	onRepoChange,
}: {
	repositories: Repository[];
	onSuccess: () => Promise<void>;
	onRepoChange: (repoId: string) => Promise<void>;
}) {
	const { activeOrganization } = useOrganizationStore((state) => state);
	const searchParams = useSearchParams();
	const [open, setOpen] = useState(false);
	const [repoFetchLoading, setRepoFetchLoading] = useState(false);
	const [githubRepos, setGithubRepos] = useState<RepoData[]>([]);
	const [selectedRepos, setSelectedRepos] = useState<RepoData[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isMounted, setIsMounted] = useState(false);

	// Ensure component is mounted
	useEffect(() => {
		setIsMounted(true);
		return () => setIsMounted(false);
	}, []);

	useEffect(() => {
		if (!isMounted) return;

		const addRepo = searchParams.get("addRepo");
		if (addRepo === "true") {
			setOpen(true);
			// Use window.history.replaceState to avoid router issues
			if (typeof window !== "undefined") {
				window.history.replaceState(null, "", "/code");
			}
		}
	}, [searchParams, isMounted]);

	const fetchGithubRepos = async () => {
		if (!isMounted) return;

		setRepoFetchLoading(true);
		try {
			const res = await fetch("/api/integrations/github/repos");
			if (!res.ok) {
				let errorMessage = "Failed to fetch repositories";
				try {
					const errorData = await res.json();
					errorMessage = errorData.error || errorMessage;
				} catch {
					// If response is not JSON, use default message
				}
				throw new Error(errorMessage);
			}
			const { data } = await res.json();

			// Validate the response data structure
			if (!Array.isArray(data)) {
				throw new Error("Invalid response format");
			}
			if (!isMounted) return;
			setGithubRepos(data);
		} catch (error) {
			if (!isMounted) return;
			toast.error("Failed to fetch your GitHub repositories");
			console.error("[FETCH_GITHUB_REPOS]", error);
			setGithubRepos([]);
		} finally {
			if (isMounted) {
				setRepoFetchLoading(false);
			}
		}
	};

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (isOpen) {
			fetchGithubRepos();
			setSelectedRepos([]);
			setSearchTerm("");
		} else {
			// Reset state when closing
			setGithubRepos([]);
			setSelectedRepos([]);
			setSearchTerm("");
		}
	};

	const handleSelectRepo = (repo: RepoData) => {
		setSelectedRepos((prev) => {
			const exists = prev.some((r) => r.externalId === repo.externalId);
			if (exists) {
				return prev.filter((r) => r.externalId !== repo.externalId);
			} else {
				return [...prev, repo];
			}
		});
	};

	const handleSaveRepos = async () => {
		if (selectedRepos.length === 0) return;

		if (!activeOrganization?.id) {
			toast.error(
				"No active organization found. Please select or create one."
			);
			return;
		}

		// Validate inputs (security: prevent malformed data)
		const repoSchema = z.array(
			z.object({
				externalId: z.string().min(1),
				name: z.string().min(1),
				fullName: z.string().min(1),
				owner: z.string().min(1),
				url: z.url(),
				defaultBranch: z.string(),
				openIssuesCount: z.number().nonnegative(),
				visibility: z.string().nullable(),
				description: z.string().nullable(),
			})
		);

		try {
			repoSchema.parse(selectedRepos);
		} catch (validationError) {
			toast.error("Invalid repository data");
			console.error("[REPO_VALIDATION]", validationError);
			return;
		}

		try {
			await saveRepositories(activeOrganization.id, selectedRepos);

			// Refresh repositories
			await onSuccess();

			// Close dialog
			setOpen(false);

			toast.success("Repositories added successfully");

			// Small delay to allow state to update
			setTimeout(async () => {
				// Find newly added repo and trigger change
				const newRepo = repositories.find((repo) =>
					selectedRepos.some((r) => r.externalId === repo.externalId)
				);
				if (newRepo) {
					try {
						await onRepoChange(newRepo.id);
					} catch (error) {
						console.error("[REPO_CHANGE]", error);
					}
				}
			}, 100);
		} catch (error) {
			toast.error("Failed to save repositories");
			console.error("[SAVE_REPOS]", error);
		}
	};

	const filteredRepos = React.useMemo(() => {
		if (!Array.isArray(githubRepos)) return [];

		return githubRepos.filter((repo) => {
			if (!repo?.fullName) return false;
			return repo.fullName
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
		});
	}, [githubRepos, searchTerm]);

	if (!isMounted) {
		return <Button disabled>Add repository</Button>;
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button>Add repository</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Select GitHub Repositories</DialogTitle>
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
							<Skeleton key={i} className="h-10 w-full" />
						))}
					</div>
				) : (
					<ScrollArea className="h-[300px] pr-4">
						{filteredRepos.length === 0 ? (
							<p className="text-center text-sm text-muted-foreground">
								{githubRepos.length === 0
									? "No repositories found in your GitHub account."
									: "No repositories match your search."}
							</p>
						) : (
							<div className="space-y-2">
								{filteredRepos.map((repo) => {
									if (!repo?.externalId || !repo?.fullName)
										return null;

									return (
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
									);
								})}
							</div>
						)}
					</ScrollArea>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleSaveRepos}
						disabled={
							selectedRepos.length === 0 || repoFetchLoading
						}
					>
						Save Selected ({selectedRepos.length})
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// Main export wrapped in Suspense
export const GitHubRepoSelection = ({
	repositories,
	onSuccess,
	onRepoChange,
}: {
	repositories: Repository[];
	onSuccess: () => Promise<void>;
	onRepoChange: (repoId: string) => Promise<void>;
}) => {
	return (
		<Suspense fallback={<Button disabled>Add repository</Button>}>
			<RepoDialogContent
				repositories={repositories}
				onSuccess={onSuccess}
				onRepoChange={onRepoChange}
			/>
		</Suspense>
	);
};
