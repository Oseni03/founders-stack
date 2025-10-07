import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, TrendingUp } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Branch } from "@prisma/client";

export const BranchActivityCard = ({
	isLoading,
	selectedRepoId,
	branches,
}: {
	isLoading: boolean;
	selectedRepoId: string;
	branches: Branch[];
}) => {
	return (
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
				{isLoading ? (
					<div className="space-y-3">
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton key={i} className="h-16" />
						))}
					</div>
				) : (
					<div className="space-y-3">
						{branches
							.filter((b) => b.repositoryId === selectedRepoId)
							.map((branch) => (
								<BranchCard branch={branch} key={branch.id} />
							))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

const BranchCard = ({ branch }: { branch: Branch }) => {
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

	return (
		<div
			key={branch.id}
			className="flex items-center justify-between p-3 rounded-lg border"
		>
			<div className="flex items-center gap-3">
				<div
					className={`h-2 w-2 rounded-full ${getBranchStatusColor(branch.status)}`}
				/>
				<div>
					<div className="font-medium text-sm">{branch.name}</div>
					<div className="text-xs text-muted-foreground">
						Last commit{" "}
						{branch.lastCommitAt?.toLocaleString() || "N/A"}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-2">
				{branch.commitsAhead > 0 && (
					<Badge variant="secondary" className="text-xs">
						<TrendingUp className="h-3 w-3 mr-1" />
						{branch.commitsAhead} ahead
					</Badge>
				)}
				<Badge variant="outline" className="text-xs capitalize">
					{branch.status}
				</Badge>
			</div>
		</div>
	);
};
