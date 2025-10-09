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
import { Loader2 } from "lucide-react";

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

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [totalCount, setTotalCount] = useState(0);

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
			if (typeof window !== "undefined") {
				window.history.replaceState(null, "", "/code");
			}
		}
	}, [searchParams, isMounted]);

	const fetchGithubRepos = async (page = 1, append = false) => {
		if (!isMounted) return;

		if (append) {
			setIsLoadingMore(true);
		} else {
			setRepoFetchLoading(true);
		}

		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: "50",
			});

			if (searchTerm) {
				params.set("search", searchTerm);
			}

			const res = await fetch(
				`/api/integrations/github/repos?${params.toString()}`
			);

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

			const { data, pagination } = await res.json();

			if (!Array.isArray(data)) {
				throw new Error("Invalid response format");
			}

			if (!isMounted) return;

			// Append or replace repos based on pagination
			if (append) {
				setGithubRepos((prev) => [...prev, ...data]);
			} else {
				setGithubRepos(data);
			}

			setCurrentPage(pagination.page);
			setTotalPages(pagination.totalPages);
			setHasMore(pagination.hasMore);
			setTotalCount(pagination.total);
		} catch (error) {
			if (!isMounted) return;
			toast.error("Failed to fetch your GitHub repositories");
			console.error("[FETCH_GITHUB_REPOS]", error);
			if (!append) {
				setGithubRepos([]);
			}
		} finally {
			if (isMounted) {
				setRepoFetchLoading(false);
				setIsLoadingMore(false);
			}
		}
	};

	// Debounced search effect
	useEffect(() => {
		if (!open) return;

		const timeoutId = setTimeout(() => {
			setCurrentPage(1);
			fetchGithubRepos(1, false);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [searchTerm, open]);

	const handleLoadMore = () => {
		if (!hasMore || isLoadingMore) return;
		fetchGithubRepos(currentPage + 1, true);
	};

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (isOpen) {
			setCurrentPage(1);
			fetchGithubRepos(1, false);
			setSelectedRepos([]);
			setSearchTerm("");
		} else {
			// Reset state when closing
			setGithubRepos([]);
			setSelectedRepos([]);
			setSearchTerm("");
			setCurrentPage(1);
			setTotalPages(1);
			setHasMore(false);
			setTotalCount(0);
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
			await onSuccess();
			setOpen(false);
			toast.success("Repositories added successfully");

			setTimeout(async () => {
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
		return githubRepos.filter((repo) => repo?.externalId && repo?.fullName);
	}, [githubRepos]);

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
					<>
						<ScrollArea className="h-[300px] pr-4">
							{filteredRepos.length === 0 ? (
								<p className="text-center text-sm text-muted-foreground py-8">
									{githubRepos.length === 0
										? "No repositories found in your GitHub account."
										: "No repositories match your search."}
								</p>
							) : (
								<div className="space-y-2">
									{filteredRepos.map((repo) => (
										<div
											key={repo.externalId}
											className="flex items-center space-x-2 py-2 hover:bg-accent rounded-md px-2 transition-colors"
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
									))}

									{/* Load More Button */}
									{hasMore && (
										<div className="pt-4 flex justify-center border-t">
											<Button
												variant="outline"
												size="sm"
												onClick={handleLoadMore}
												disabled={isLoadingMore}
											>
												{isLoadingMore ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Loading more...
													</>
												) : (
													`Load More (${currentPage} of ${totalPages})`
												)}
											</Button>
										</div>
									)}
								</div>
							)}
						</ScrollArea>

						{/* Pagination Info */}
						{filteredRepos.length > 0 && (
							<div className="text-xs text-muted-foreground text-center pt-2 border-t">
								Showing {filteredRepos.length} of {totalCount}{" "}
								repositories
								{hasMore &&
									` • Page ${currentPage} of ${totalPages}`}
							</div>
						)}
					</>
				)}
				<DialogFooter className="flex-col sm:flex-row gap-2">
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
