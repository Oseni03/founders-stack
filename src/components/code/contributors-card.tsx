import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Contributor } from "@/types/code";
import { Users } from "lucide-react";
import Image from "next/image";

export const ContributorsCard = ({
	contributors,
}: {
	contributors: Contributor[];
}) => {
	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="h-5 w-5" />
					Top Contributors
				</CardTitle>
				<CardDescription>
					Most active contributors this period
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{contributors?.map((contributor, index: number) => (
						<div
							key={contributor.login}
							className="flex items-center justify-between rounded-lg border border-border p-4"
						>
							<div className="flex items-center gap-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
									{index + 1}
								</div>
								<Image
									src={
										contributor.avatarUrl ||
										"/placeholder.svg"
									}
									alt={contributor.name || "contributor"}
									className="h-8 w-8 rounded-full"
									width={32}
									height={32}
								/>
								<div>
									<p className="font-medium text-foreground">
										{contributor.name}
									</p>
									<p className="text-xs text-muted-foreground">
										@{contributor.login}
									</p>
								</div>
							</div>
							<div className="text-right">
								<p className="font-semibold text-foreground">
									{contributor.contributions}
								</p>
								<p className="text-xs text-muted-foreground">
									contributions
								</p>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
};
