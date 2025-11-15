import { GitCommit } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Commit } from "@/types/code";

export const CommitsCard = ({ commits }: { commits: Commit[] }) => {
	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<GitCommit className="h-5 w-5" />
					Recent Commits
				</CardTitle>
				<CardDescription>
					Latest commits to the repository
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{commits?.slice(0, 8).map((commit) => (
						<div
							key={commit.id}
							className="flex items-start justify-between rounded-lg border border-border p-4"
						>
							<div className="flex-1">
								<div className="flex items-center gap-3">
									<Image
										src={
											commit.avatarUrl ||
											"/placeholder.svg"
										}
										alt={commit.authorName}
										className="h-8 w-8 rounded-full"
										width={32}
										height={32}
									/>
									<div>
										<p className="font-medium text-foreground">
											{commit.message}
										</p>
										<p className="text-xs text-muted-foreground">
											by {commit.authorName} on{" "}
											{new Date(
												commit.committedAt
											).toLocaleDateString()}
										</p>
									</div>
								</div>
							</div>
							<div className="ml-4 flex items-center gap-2 text-xs">
								<span className="rounded bg-green-100 px-2 py-1 text-green-700">
									+{commit.additions}
								</span>
								<span className="rounded bg-red-100 px-2 py-1 text-red-700">
									-{commit.deletions}
								</span>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
};
