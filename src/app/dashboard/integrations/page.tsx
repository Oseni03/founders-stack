"use client";

import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Plug, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { INTEGRATIONS, mergeIntegrations } from "@/lib/oauth-utils";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/integrations/connect-button";
import { DisconnectButton } from "@/components/integrations/disconnect-button";

export default function IntegrationsPage() {
	const { integrations, error, connect, fetchIntegrations } =
		useIntegrationsStore((state) => state);

	useEffect(() => {
		if (error) {
			toast.error(error);
		}
	}, [error]);

	const lastSyncTime = useMemo(() => {
		if (!integrations || integrations.length === 0) return "N/A";

		const lastSync = integrations[0]?.lastSyncAt;
		if (!lastSync) return "N/A";

		const date =
			typeof lastSync === "string" ? new Date(lastSync) : lastSync;
		return isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
	}, [integrations]);

	const mergedIntegrations = useMemo(() => {
		if (!integrations) return INTEGRATIONS;
		return mergeIntegrations(INTEGRATIONS, integrations);
	}, [integrations]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Integrations
				</h1>
				<p className="text-muted-foreground mt-1">
					Connect your tools to aggregate data in one place
				</p>
			</div>

			{/* Stats */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Connected
						</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{integrations?.length || 0}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Active integrations
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Available
						</CardTitle>
						<Plug className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{INTEGRATIONS.length}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Ready to connect
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Last Sync
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{lastSyncTime}</div>
						<p className="text-xs text-muted-foreground mt-1">
							Most recent
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Integrations List */}
			<div className="grid gap-4">
				{mergedIntegrations.map((integration) => (
					<Card key={integration.id}>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
										<Plug className="h-6 w-6 text-primary" />
									</div>
									<div>
										<CardTitle className="text-lg">
											{integration.name}
										</CardTitle>
										<p className="text-sm text-muted-foreground">
											{integration.category}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									{integration.status === "active" && (
										<>
											<Badge
												variant="outline"
												className="gap-1"
											>
												<CheckCircle2 className="h-3 w-3 text-success" />
												Connected
											</Badge>
											<DisconnectButton
												integrationId={
													integration.metadata
														?.integrationId
												}
												integrationName={
													integration.name
												}
												onDisconnect={fetchIntegrations}
											/>
										</>
									)}
									{integration.status === "error" && (
										<>
											<Badge
												variant="outline"
												className="gap-1 border-destructive"
											>
												<XCircle className="h-3 w-3 text-destructive" />
												Error
											</Badge>
											<Button variant="outline" size="sm">
												Retry
											</Button>
										</>
									)}
									{integration.status === "inactive" && (
										<ConnectButton
											integration={integration}
											onConnect={connect}
										/>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="text-sm text-muted-foreground">
								Last sync:{" "}
								{integration.lastSyncAt?.toLocaleDateString() ||
									"Never"}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
