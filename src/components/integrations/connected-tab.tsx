import React from "react";
import { TabsContent } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { IntegrationCard } from "./integration-card";
import { Card, CardContent } from "../ui/card";
import { AlertCircle } from "lucide-react";
import { Integration } from "@prisma/client";

export const ConnectedTab = ({
	isLoading,
	syncLoading,
	integrations,
	onConnect,
	sync,
}: {
	isLoading: boolean;
	syncLoading: boolean;
	integrations: Integration[];
	onConnect: (toolName: string) => Promise<void>;
	sync: (toolName: string) => Promise<void>;
}) => {
	return (
		<>
			<TabsContent value="connected" className="space-y-4">
				{isLoading ? (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-64" />
						))}
					</div>
				) : integrations.length > 0 ? (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{integrations.map((integration) => (
							<IntegrationCard
								key={integration.id}
								syncLoading={syncLoading}
								sync={sync}
								integration={integration}
								handleConnect={onConnect}
							/>
						))}
					</div>
				) : (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">
								No connected integrations
							</h3>
							<p className="text-sm text-muted-foreground text-center mb-4">
								Connect your first integration to start
								aggregating data
							</p>
						</CardContent>
					</Card>
				)}
			</TabsContent>
		</>
	);
};
