import { GitPullRequest } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { PullRequest } from "@/types/code";

export const PRCard = ({ prs }: { prs?: PullRequest[] }) => {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "success":
				return "bg-green-100 text-green-700";
			case "failed":
				return "bg-red-100 text-red-700";
			case "merged":
				return "bg-purple-100 text-purple-700";
			case "open":
				return "bg-blue-100 text-blue-700";
			case "draft":
				return "bg-gray-100 text-gray-700";
			default:
				return "bg-yellow-100 text-yellow-700";
		}
	};

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<GitPullRequest className="h-5 w-5" />
					Pull Requests
				</CardTitle>
				<CardDescription>
					Recent pull requests and their status
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{prs?.slice(0, 8).map((pr) => (
						<div
							key={pr.id}
							className="flex items-center justify-between rounded-lg border border-border p-4"
						>
							<div className="flex-1">
								<div className="flex items-center gap-3">
									<Image
										src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${pr.authorName}`}
										alt={pr.authorName}
										className="h-8 w-8 rounded-full"
										width={32}
										height={32}
									/>
									<div>
										<p className="font-medium text-foreground">
											#{pr.number} {pr.title}
										</p>
										<p className="text-xs text-muted-foreground">
											by {pr.authorName} •{" "}
											{pr.reviewerCount} reviewer
											{pr.reviewerCount !== 1
												? "s"
												: ""}{" "}
											• {pr.avgReviewTime}h avg review
											time
										</p>
									</div>
								</div>
							</div>
							<span
								className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(pr.status)}`}
							>
								{pr.status.charAt(0).toUpperCase() +
									pr.status.slice(1)}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
};
