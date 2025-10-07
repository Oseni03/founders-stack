"use client";

import React, { useEffect, useState } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { RepoData } from "@/lib/connectors/github";
import { toast } from "sonner";
import { saveRepositories } from "@/server/code";
import { z } from "zod"; // Import Zod for input validation (security: prevent injection)
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { Skeleton } from "../ui/skeleton";
import { Repository } from "@prisma/client";

export const GitHubRepoSelection = ({
	repositories,
	onSuccess,
	onRepoChange,
}: {
	repositories: Repository[];
	onSuccess: () => Promise<void>;
	onRepoChange: (repoId: string) => Promise<void>;
}) => {
	const { activeOrganization } = useOrganizationStore((state) => state);
	const router = useRouter();
	const searchParams = useSearchParams();
	const [open, setOpen] = useState(false);
	const [repoFetchLoading, setRepoFetchLoading] = useState(false);
	const [githubRepos, setGithubRepos] = useState<RepoData[]>([]);
	const [selectedRepos, setSelectedRepos] = useState<RepoData[]>([]);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		const addRepo = searchParams.get("addRepo");
		if (addRepo === "true") {
			setOpen(true);
			router.replace("/code"); // Remove param to prevent loops
		}
	}, [searchParams, router]);

	const fetchGithubRepos = async () => {
		setRepoFetchLoading(true);
		try {
			const res = await fetch("/api/integrations/github/repos");
			if (!res.ok) {
				throw new Error(await res.text());
			}
			const data: RepoData[] = await res.json();
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

		if (!activeOrganization || !activeOrganization.id) {
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
				openIssuesCount: z.number(),
				visibility: z.string().nullable(),
				description: z.string().nullable(),
			})
		);
		try {
			repoSchema.parse(selectedRepos); // Throws if invalid
		} catch (validationError) {
			toast.error("Invalid repository data");
			console.error("[REPO_VALIDATION]", validationError);
			return;
		}

		try {
			await saveRepositories(activeOrganization.id, selectedRepos);
			await onSuccess(); // Refresh repositories state
			setOpen(false);
			toast.success("Repositories added successfully");
			const newRepo = repositories.find((repo) =>
				selectedRepos.some((r) => r.externalId === repo.externalId)
			);
			if (newRepo) {
				await onRepoChange(newRepo.id);
			}
		} catch (error) {
			toast.error("Failed to save repositories");
			console.error("[SAVE_REPOS]", error);
		}
	};

	const filteredRepos = githubRepos.filter((repo) =>
		repo.fullName.toLowerCase().includes(searchTerm.toLowerCase())
	);
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
												r.externalId === repo.externalId
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
};
