import React from "react";
import { TabsContent } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { UnconnectedIntegrationCard } from "./integration-card";
import { INTEGRATIONS } from "@/lib/oauth-utils";

export const AvailableTab = ({
	isLoading,
	onConnect,
}: {
	isLoading: boolean;
	onConnect: (integrationId: string) => Promise<void>;
}) => {
	return (
		<TabsContent value="available" className="space-y-4">
			{isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Skeleton key={i} className="h-64" />
					))}
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{INTEGRATIONS.map((integration) => (
						<UnconnectedIntegrationCard
							key={integration.id}
							integration={integration}
							handleConnect={onConnect}
						/>
					))}
				</div>
			)}
		</TabsContent>
	);
};
