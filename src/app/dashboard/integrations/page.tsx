"use client";

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import {
	CheckCircle2,
	XCircle,
	RefreshCw,
	Settings,
	Plug,
	Clock,
	AlertCircle,
	ExternalLink,
	Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Integration, IntegrationStatus } from "@prisma/client";
import { toast } from "sonner";
import { getProviderLogo } from "@/lib/oauth-utils";

export default function IntegrationsPage() {
	const [integrations, setIntegrations] = useState<Integration[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [connectDialogOpen, setConnectDialogOpen] = useState(false);
	const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
	const [selectedIntegration, setSelectedIntegration] =
		useState<Integration | null>(null);
	const [apiKey, setApiKey] = useState("");
	const [isSyncing, setIsSyncing] = useState<string | null>(null);

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

	const handleConnect = async (integration: Integration) => {
		setSelectedIntegration(integration);
		try {
			await fetch(`/api/integrations/${integration.id}/connect`);
		} catch (error) {
			console.error(`Failed to connect ${integration.id}: `, error);
			toast.error(`Failed to connect ${integration.id}`);
		}
	};

	const handleConnectWithApiKey = async () => {
		if (!selectedIntegration) return;

		try {
			const response = await fetch(
				`/api/integrations/${selectedIntegration.id}/connect`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ apiKey }),
				}
			);

			if (response.ok) {
				await fetchIntegrations();
				setConnectDialogOpen(false);
				setApiKey("");
			}
		} catch (error) {
			console.error("Failed to connect integration:", error);
		}
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

	const handleManualSync = async (integrationId: string) => {
		setIsSyncing(integrationId);
		try {
			await fetch(`/api/integrations/${integrationId}/sync`, {
				method: "POST",
			});
			await fetchIntegrations();
		} catch (error) {
			console.error("[v0] Failed to sync integration:", error);
		} finally {
			setIsSyncing(null);
		}
	};

	const connectedIntegrations = integrations.filter(
		(i) => i.status === IntegrationStatus.active
	);
	const availableIntegrations = integrations.filter(
		(i) => i.status === IntegrationStatus.inactive
	);

	const IntegrationCard = ({ integration }: { integration: Integration }) => {
		const name =
			integration.type[0].toUpperCase + integration.type.slice(1);
		const logo = getProviderLogo(integration.type);
		return (
			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div className="flex items-center gap-3">
							<div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
								<Image
									src={logo}
									alt={name}
									className="h-8 w-8"
								/>
							</div>
							<div>
								<CardTitle className="text-lg">
									{name}
								</CardTitle>
								<Badge
									variant="outline"
									className="mt-1 text-xs capitalize"
								>
									{integration.category}
								</Badge>
							</div>
						</div>
						{integration.status === IntegrationStatus.active ? (
							<CheckCircle2 className="h-5 w-5 text-green-500" />
						) : (
							<XCircle className="h-5 w-5 text-muted-foreground" />
						)}
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Lorem ipsum dolor sit amet consectetur adipisicing elit.
						Distinctio aliquam, odio error necessitatibus sit
						voluptatibus fuga velit amet quis repellat inventore
						nesciunt neque, libero, hic ipsa quo quibusdam vero
						quos!
					</p>

					{integration.status === IntegrationStatus.active && (
						<div className="mt-4 space-y-2 text-xs">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">
									Last sync:
								</span>
								<span className="font-medium">
									{integration.lastSyncAt?.toLocaleDateString()}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">
									Category:
								</span>
								<span className="font-medium">
									{integration.category}
								</span>
							</div>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex gap-2">
					{integration.status === IntegrationStatus.active ? (
						<>
							<Button
								variant="outline"
								size="sm"
								className="flex-1 bg-transparent"
								onClick={() => handleManualSync(integration.id)}
								disabled={isSyncing === integration.id}
							>
								{isSyncing === integration.id ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Syncing...
									</>
								) : (
									<>
										<RefreshCw className="h-4 w-4 mr-2" />
										Sync Now
									</>
								)}
							</Button>
							<Button variant="outline" size="sm">
								<Settings className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setSelectedIntegration(integration);
									setDisconnectDialogOpen(true);
								}}
							>
								Disconnect
							</Button>
						</>
					) : (
						<>
							<Button
								className="flex-1"
								size="sm"
								onClick={() => handleConnect(integration)}
							>
								<Plug className="h-4 w-4 mr-2" />
								Connect
							</Button>
							<Button variant="outline" size="sm" asChild>
								<Link
									href={""}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLink className="h-4 w-4" />
								</Link>
							</Button>
						</>
					)}
				</CardFooter>
			</Card>
		);
	};

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
							{availableIntegrations.length}
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
						Available ({availableIntegrations.length})
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
							{availableIntegrations.map((integration) => (
								<IntegrationCard
									key={integration.id}
									integration={integration}
								/>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Connect Dialog (API Key) */}
			<Dialog
				open={connectDialogOpen}
				onOpenChange={setConnectDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Connect {selectedIntegration?.type}
						</DialogTitle>
						<DialogDescription>
							Enter your API key to connect this integration
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="api-key">API Key</Label>
							<Input
								id="api-key"
								type="password"
								placeholder="Enter your API key"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
							/>
						</div>
						<div className="text-xs text-muted-foreground">
							You can find your API key in your{" "}
							{selectedIntegration?.type} account settings.{" "}
							<Link
								href={"#"}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								View documentation
							</Link>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConnectDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConnectWithApiKey}
							disabled={!apiKey}
						>
							Connect
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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
