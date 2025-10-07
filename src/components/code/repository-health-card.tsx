import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { RepoHealth } from "@/types/code";

export const RepositoryHealthCard = ({
	isLoading,
	repoHealth,
}: {
	isLoading: boolean;
	repoHealth: RepoHealth | null;
}) => {
	const getHealthColor = (score: number) => {
		if (score >= 80) return "text-green-500";
		if (score >= 60) return "text-yellow-500";
		return "text-red-500";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="h-5 w-5" />
					Repository Health
				</CardTitle>
				<CardDescription>Overall health metrics</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4">
						<Skeleton className="h-20" />
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
						<Skeleton className="h-16" />
					</div>
				) : (
					repoHealth && (
						<div className="space-y-6">
							<div className="text-center">
								<div
									className={`text-5xl font-bold ${getHealthColor(repoHealth.score)}`}
								>
									{repoHealth.score}
								</div>
								<div className="text-sm text-muted-foreground mt-1">
									Health Score
								</div>
							</div>
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<span className="text-sm">Open Issues</span>
									<Badge variant="outline">
										{repoHealth.openIssues}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">Stale PRs</span>
									<Badge variant="outline">
										{repoHealth.stalePRs}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">
										Avg Review Time
									</span>
									<Badge variant="outline">
										{repoHealth.codeReviewTime}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm">
										Test Coverage
									</span>
									<Badge variant="outline">
										{repoHealth.testCoverage}%
									</Badge>
								</div>
							</div>
						</div>
					)
				)}
			</CardContent>
		</Card>
	);
};
