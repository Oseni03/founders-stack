"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Plug, Clock, AlertCircle } from "lucide-react";
import { Integration, IntegrationStatus } from "@prisma/client";
import { toast } from "sonner";
import { INTEGRATIONS } from "@/lib/oauth-utils";
import {
	IntegrationCard,
	UnconnectedIntegrationCard,
} from "@/components/integrations/integration-card";

export default function IntegrationsPage() {
	const [integrations, setIntegrations] = useState<Integration[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
	const [selectedIntegration, setSelectedIntegration] =
		useState<Integration | null>(null);

	useEffect(() => {
		fetchIntegrations();
	}, []);

	const fetchIntegrations = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/integrations");
			const data = await response.json();
			setIntegrations(data.integrations || []);
		} catch (error) {
			console.error("Failed to fetch integrations:", error);
			toast.error("Integrations not found");
		} finally {
			setIsLoading(false);
		}
	};

	const handleConnect = async (integrationId: string) => {
		try {
			const resp = await fetch(
				`/api/integrations/${integrationId}/connect`
			);
			if (resp.ok) {
				const data = await resp.json();
				if (data.url) {
					window.location.href = data.url;
				}
			} else {
				toast.error(`Failed to connect ${integrationId}`);
			}
		} catch (error) {
			console.error(`Failed to connect ${integrationId}: `, error);
			toast.error(`Failed to connect ${integrationId}`);
		}
	};

	const onDisconnect = (integration: Integration) => {
		setSelectedIntegration(integration);
		setDisconnectDialogOpen(true);
	};

	const handleDisconnect = async () => {
		if (!selectedIntegration) return;

		try {
			const response = await fetch(
				`/api/integrations/${selectedIntegration.id}/disconnect`,
				{
					method: "POST",
					body: JSON.stringify({
						integrationId: selectedIntegration.id,
					}),
				}
			);

			if (response.ok) {
				await fetchIntegrations();
				setDisconnectDialogOpen(false);
			}
		} catch (error) {
			console.error("[v0] Failed to disconnect integration:", error);
		}
	};

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

				<TabsContent value="connected" className="space-y-4">
					{isLoading ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-64" />
							))}
						</div>
					) : connectedIntegrations.length > 0 ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{connectedIntegrations.map((integration) => (
								<IntegrationCard
									key={integration.id}
									integration={integration}
									fetchIntegrations={fetchIntegrations}
									handleConnect={handleConnect}
									onDisconnect={onDisconnect}
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
									handleConnect={handleConnect}
								/>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Disconnect Dialog */}
			<AlertDialog
				open={disconnectDialogOpen}
				onOpenChange={setDisconnectDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Disconnect {selectedIntegration?.type}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will stop syncing data from{" "}
							{selectedIntegration?.type}. Your existing data will
							be preserved, but no new data will be imported.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDisconnect}>
							Disconnect
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
