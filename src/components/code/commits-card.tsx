import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GitCommit } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { CommitType } from "@/types/code";

export const CommitsCard = ({
	isLoading,
	selectedRepoId,
	commits,
}: {
	isLoading: boolean;
	selectedRepoId: string;
	commits: CommitType[];
}) => {
	return (
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
						{commits
							.filter((c) => c.repositoryId === selectedRepoId)
							.map((commit) => (
								<CommitLink key={commit.id} commit={commit} />
							))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

const CommitLink = ({ commit }: { commit: CommitType }) => {
	return (
		<a
			href={commit.attributes.url || "#"}
			target="_blank"
			rel="noopener noreferrer"
			className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
		>
			<Avatar className="h-10 w-10 mt-1">
				<AvatarImage
					src={commit.avatarUrl || "/placeholder.svg"}
					alt={commit.authorName || "Author"}
				/>
				<AvatarFallback>
					{commit.authorName?.slice(0, 2).toUpperCase() || "AU"}
				</AvatarFallback>
			</Avatar>
			<div className="flex-1 min-w-0">
				<div className="font-medium text-sm">{commit.message}</div>
				<div className="flex-1 min-w-0">
					<div className="font-medium text-sm">{commit.message}</div>
					<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
						<span>{commit.authorName}</span>
						<span>•</span>
						<span>{commit.committedAt.toLocaleString()}</span>
						<span>•</span>
						<Badge variant="outline" className="text-xs">
							{commit.repositoryId}
						</Badge>

						{/* Commit Stats */}
						{(commit.additions !== undefined ||
							commit.deletions !== undefined) && (
							<>
								<span>•</span>
								<span className="flex items-center gap-2">
									{commit.additions && (
										<span className="text-green-600 dark:text-green-400 font-medium">
											+{commit.additions.toLocaleString()}
										</span>
									)}
									{commit.deletions && (
										<span className="text-red-600 dark:text-red-400 font-medium">
											-{commit.deletions.toLocaleString()}
										</span>
									)}
									{commit.additions && commit.deletions && (
										<span className="text-muted-foreground">
											(±
											{(
												commit.additions +
												commit.deletions
											).toLocaleString()}
											)
										</span>
									)}
								</span>
							</>
						)}
					</div>
				</div>
			</div>
		</a>
	);
};
