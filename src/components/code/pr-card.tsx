import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitMerge, GitPullRequest } from "lucide-react";
import { PRStatus } from "@/types/code";

export const PRCard = ({ prStatus }: { prStatus: PRStatus }) => {
	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Open PRs
					</CardTitle>
					<GitPullRequest className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{prStatus.open}</div>
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
					<div className="text-2xl font-bold">{prStatus.merged}</div>
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
					<div className="text-2xl font-bold">{prStatus.draft}</div>
					<p className="text-xs text-muted-foreground mt-1">
						Work in progress
					</p>
				</CardContent>
			</Card>
		</>
	);
};
