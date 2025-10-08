"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Plug, Clock } from "lucide-react";
import { IntegrationStatus } from "@prisma/client";
import { toast } from "sonner";
import { INTEGRATIONS } from "@/lib/oauth-utils";
import { ConnectedTab } from "@/components/integrations/connected-tab";
import { AvailableTab } from "@/components/integrations/available-tab";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";

export default function IntegrationsPage() {
	const {
		integrations,
		loading,
		syncLoading,
		error,
		connect,
		sync,
		fetchIntegrations,
	} = useIntegrationsStore((state) => state);

	useEffect(() => {
		fetchIntegrations();
	}, [fetchIntegrations]);

	useEffect(() => {
		toast.error(error);
	}, [error]);

	const connectedIntegrations = integrations.filter(
		(i) => i.status === IntegrationStatus.active
	);

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
							{connectedIntegrations.length}
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
						<div className="text-2xl font-bold">
							{connectedIntegrations[0]?.lastSyncAt?.toLocaleString() ||
								"N/A"}
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							Most recent
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Integrations Tabs */}
			<Tabs defaultValue="connected" className="space-y-4">
				<TabsList>
					<TabsTrigger value="connected">
						Connected ({connectedIntegrations.length})
					</TabsTrigger>
					<TabsTrigger value="available">
						Available ({INTEGRATIONS.length})
					</TabsTrigger>
				</TabsList>

				<ConnectedTab
					isLoading={loading}
					syncLoading={syncLoading}
					integrations={integrations}
					onConnect={connect}
					sync={sync}
				/>

				<AvailableTab isLoading={loading} onConnect={connect} />
			</Tabs>
		</div>
	);
}
