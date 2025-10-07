import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GitBranch, GitCommit } from "lucide-react";
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
												commit.attributes.avatarUrl ||
												"/placeholder.svg"
											}
											alt={commit.authorId || "Author"}
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
	);
};
