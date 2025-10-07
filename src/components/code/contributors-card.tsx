import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { ContributorType } from "@/types/code";

export const ContributorsCard = ({
	contributors,
	isLoading,
	selectedRepoId,
}: {
	contributors: ContributorType[];
	isLoading: boolean;
	selectedRepoId: string;
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="h-5 w-5" />
					Top Contributors
				</CardTitle>
				<CardDescription>
					Most active contributors this month
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4">
						{[1, 2, 3, 4, 5].map((i) => (
							<Skeleton key={i} className="h-16" />
						))}
					</div>
				) : (
					<div className="space-y-4">
						{contributors
							.filter((c) => c.repositoryId === selectedRepoId)
							.map((contributor, index) => (
								<Contributorcard
									key={contributor.id}
									index={index}
									contributor={contributor}
								/>
							))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};

const Contributorcard = ({
	index,
	contributor,
}: {
	index: number;
	contributor: ContributorType;
}) => {
	return (
		<div className="flex items-center gap-4">
			<div className="flex items-center gap-3 flex-1">
				<div className="text-sm font-medium text-muted-foreground w-6">
					{index + 1}
				</div>
				<Avatar className="h-10 w-10">
					<AvatarImage
						src={
							contributor.attributes.avatarUrl ||
							"/placeholder.svg"
						}
						alt={contributor.login}
					/>
					<AvatarFallback>
						{contributor.login.slice(0, 2).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1">
					<div className="font-medium">{contributor.login}</div>
					<div className="text-xs text-muted-foreground">
						{contributor.contributions} commits
					</div>
				</div>
			</div>
			<div className="text-right text-xs text-muted-foreground">
				<div className="text-green-500">
					+{contributor.attributes.additions?.toLocaleString() || 0}
				</div>
				<div className="text-red-500">
					-{contributor.attributes.deletions?.toLocaleString() || 0}
				</div>
			</div>
		</div>
	);
};
