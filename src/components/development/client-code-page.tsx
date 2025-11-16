"use client";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCodeStore } from "@/zustand/providers/code-store-provider";
import { Build, Commit, PullRequest, Repository } from "@prisma/client";
import { getPullRequests } from "@/server/categories/code";

export function ClientCodePage({
	organizationId,
	initialData,
}: {
	organizationId: string;
	initialData: {
		repositories: Repository[];
		pullRequests: PullRequest[];
		builds: Build[];
		commits: Commit[];
	};
}) {
	const {
		repositories,
		commits,
		pullRequests,
		builds,
		prFilters,
		selectedPullRequest,
		setRepositories,
		setPullRequests,
		setCommits,
		setBuilds,
		setPrFilters,
		setSelectedPullRequest,
	} = useCodeStore((state) => state);

	useEffect(() => {
		setRepositories(initialData.repositories);
		setPullRequests(initialData.pullRequests);
		setCommits(initialData.commits);
		setBuilds(initialData.builds);
	}, [initialData]);

	// Handle PR filter changes and refetch
	const handlePrFilterChange = async (
		key: keyof typeof prFilters,
		value: string
	) => {
		setPrFilters({ [key]: value });
		const newPrs = await getPullRequests(organizationId, {
			...prFilters,
			[key]: value,
		});
		setPullRequests(newPrs);
	};

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-foreground">
				Code Overview
			</h1>
			<Tabs defaultValue="pull-requests" className="space-y-4">
				<TabsList className="grid w-full grid-cols-4 md:grid-cols-4">
					<TabsTrigger value="pull-requests">
						Pull Requests
					</TabsTrigger>
					<TabsTrigger value="repositories">Repositories</TabsTrigger>
					<TabsTrigger value="builds">Builds/CI/CD</TabsTrigger>
					<TabsTrigger value="commits">Commits</TabsTrigger>
				</TabsList>
				<TabsContent value="pull-requests" className="space-y-4">
					{/* Filter Bar */}
					<div className="flex flex-col md:flex-row gap-4">
						<Select
							value={prFilters.status}
							onValueChange={(v) =>
								handlePrFilterChange("status", v)
							}
						>
							<SelectTrigger className="w-full md:w-[180px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Open">Open</SelectItem>
								<SelectItem value="Closed">Closed</SelectItem>
								<SelectItem value="Merged">Merged</SelectItem>
								<SelectItem value="Draft">Draft</SelectItem>
							</SelectContent>
						</Select>
						{/* Add other filters similarly */}
					</div>
					{/* PR List */}
					{pullRequests.map((pr) => (
						<Card
							key={pr.id}
							className="cursor-pointer"
							onClick={() => setSelectedPullRequest(pr)}
						>
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle className="text-lg">
									{pr.title}
								</CardTitle>
								<Badge
									variant={
										pr.state === "Open"
											? "default"
											: "secondary"
									}
								>
									{pr.state}
								</Badge>
							</CardHeader>
							<CardContent>
								<div className="flex items-center space-x-2 text-sm text-muted-foreground">
									<Avatar className="h-6 w-6">
										<AvatarFallback>
											{pr.authorName[0]}
										</AvatarFallback>
									</Avatar>
									<span>{pr.authorName}</span>
									<span>
										• +{pr.additions} -{pr.deletions} •{" "}
										{pr.changedFiles} files
									</span>
								</div>
								{/* Actions */}
								<div className="mt-4 flex space-x-2">
									<Button variant="outline" size="sm">
										Review
									</Button>
									<Button variant="outline" size="sm">
										Approve
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
					{/* PR Detail Panel if selected */}
					{selectedPullRequest && (
						<Card>
							<CardHeader>
								<CardTitle>
									{selectedPullRequest.title}
								</CardTitle>
								{/* Detail content */}
							</CardHeader>
						</Card>
					)}
				</TabsContent>
				<TabsContent value="repositories" className="space-y-4">
					{repositories.map((repo) => (
						<Card key={repo.id}>
							<CardHeader>
								<CardTitle>{repo.name}</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-sm text-muted-foreground">
									{repo.language} • ⭐ {repo.stars} •{" "}
									{repo.isPrivate ? "Private" : "Public"}
								</div>
								{/* More details */}
							</CardContent>
						</Card>
					))}
				</TabsContent>
				{/* Similar for builds and commits tabs */}
			</Tabs>
		</div>
	);
}
