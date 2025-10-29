import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Deployment } from "@/types/code";

export const DeploymentsCard = ({
	deployments,
}: {
	deployments: Deployment[];
}) => {
	const deploymentTimeline = deployments.map((deploy) => ({
		id: deploy.id,
		environment: deploy.environment,
		status: deploy.status,
		timestamp: new Date(deploy.timestamp).toLocaleDateString(),
		time: new Date(deploy.timestamp).toLocaleTimeString(),
	}));

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>Recent Deployments</CardTitle>
				<CardDescription>Latest deployment activity</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{deploymentTimeline.map((deploy) => (
						<div
							key={deploy.id}
							className="flex items-center justify-between rounded-lg border border-border p-4"
						>
							<div className="flex-1">
								<p className="font-medium text-foreground capitalize">
									{deploy.environment}
								</p>
								<p className="text-sm text-muted-foreground">
									{deploy.timestamp} at {deploy.time}
								</p>
							</div>
							<span
								className={`rounded-full px-3 py-1 text-xs font-semibold ${
									deploy.status === "success"
										? "bg-green-100 text-green-700"
										: deploy.status === "failed"
											? "bg-red-100 text-red-700"
											: "bg-yellow-100 text-yellow-700"
								}`}
							>
								{deploy.status.charAt(0).toUpperCase() +
									deploy.status.slice(1)}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
};
