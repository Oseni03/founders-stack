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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

interface Integration {
	id: string;
	name: string;
	description: string;
	category:
		| "project"
		| "analytics"
		| "payments"
		| "communication"
		| "monitoring";
	logo: string;
	status: "connected" | "disconnected";
	authType: "oauth" | "api_key";
	lastSync?: string;
	syncFrequency?: string;
	nextSync?: string;
	docsUrl: string;
}

interface SyncHistory {
	id: string;
	timestamp: string;
	status: "success" | "failed";
	itemsSynced: number;
	duration: string;
}

export default function IntegrationsPage() {
	const [integrations, setIntegrations] = useState<Integration[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [connectDialogOpen, setConnectDialogOpen] = useState(false);
	const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
	const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
	const [selectedIntegration, setSelectedIntegration] =
		useState<Integration | null>(null);
	const [apiKey, setApiKey] = useState("");
	const [syncFrequency, setSyncFrequency] = useState("15");
	const [isSyncing, setIsSyncing] = useState<string | null>(null);
	const [isTesting, setIsTesting] = useState<string | null>(null);
	const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);

	useEffect(() => {
		fetchIntegrations();
	}, []);

	const fetchIntegrations = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/integrations");
			const data = await response.json();
			setIntegrations(data.integrations);
		} catch (error) {
			console.error("[v0] Failed to fetch integrations:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleConnect = async (integration: Integration) => {
		setSelectedIntegration(integration);
		if (integration.authType === "oauth") {
			// Redirect to OAuth flow
			window.location.href = `/api/integrations/${integration.id}/connect`;
		} else {
			// Show API key dialog
			setConnectDialogOpen(true);
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
			console.error("[v0] Failed to connect integration:", error);
		}
	};

	const handleDisconnect = async () => {
		if (!selectedIntegration) return;

		try {
			const response = await fetch(
				`/api/integrations/${selectedIntegration.id}/disconnect`,
				{
					method: "POST",
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

	const handleTestConnection = async (integrationId: string) => {
		setIsTesting(integrationId);
		try {
			const response = await fetch(
				`/api/integrations/${integrationId}/test`
			);
			const data = await response.json();
			alert(
				data.success
					? "Connection test successful!"
					: "Connection test failed!"
			);
		} catch (error) {
			console.error("[v0] Failed to test connection:", error);
			alert("Connection test failed!");
		} finally {
			setIsTesting(null);
		}
	};

	const handleUpdateSettings = async () => {
		if (!selectedIntegration) return;

		try {
			await fetch(
				`/api/integrations/${selectedIntegration.id}/settings`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ syncFrequency }),
				}
			);
			await fetchIntegrations();
			setSettingsDialogOpen(false);
		} catch (error) {
			console.error("[v0] Failed to update settings:", error);
		}
	};

	const openSettings = async (integration: Integration) => {
		setSelectedIntegration(integration);
		setSyncFrequency(integration.syncFrequency || "15");
		setSettingsDialogOpen(true);

		// Fetch sync history
		try {
			const response = await fetch(
				`/api/integrations/${integration.id}/history`
			);
			const data = await response.json();
			setSyncHistory(data.history);
		} catch (error) {
			console.error("[v0] Failed to fetch sync history:", error);
		}
	};

	const connectedIntegrations = integrations.filter(
		(i) => i.status === "connected"
	);
	const availableIntegrations = integrations.filter(
		(i) => i.status === "disconnected"
	);

	const IntegrationCard = ({ integration }: { integration: Integration }) => (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
							<Image
								src={integration.logo || "/placeholder.svg"}
								alt={integration.name}
								className="h-8 w-8"
							/>
						</div>
						<div>
							<CardTitle className="text-lg">
								{integration.name}
							</CardTitle>
							<Badge
								variant="outline"
								className="mt-1 text-xs capitalize"
							>
								{integration.category}
							</Badge>
						</div>
					</div>
					{integration.status === "connected" ? (
						<CheckCircle2 className="h-5 w-5 text-green-500" />
					) : (
						<XCircle className="h-5 w-5 text-muted-foreground" />
					)}
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">
					{integration.description}
				</p>

				{integration.status === "connected" && (
					<div className="mt-4 space-y-2 text-xs">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">
								Last sync:
							</span>
							<span className="font-medium">
								{integration.lastSync}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">
								Frequency:
							</span>
							<span className="font-medium">
								Every {integration.syncFrequency} min
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">
								Next sync:
							</span>
							<span className="font-medium">
								{integration.nextSync}
							</span>
						</div>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex gap-2">
				{integration.status === "connected" ? (
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
						<Button
							variant="outline"
							size="sm"
							onClick={() => openSettings(integration)}
						>
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
								href={integration.docsUrl}
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
							{connectedIntegrations[0]?.lastSync || "N/A"}
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
							Connect {selectedIntegration?.name}
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
							{selectedIntegration?.name} account settings.{" "}
							<a
								href={selectedIntegration?.docsUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								View documentation
							</a>
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
							Disconnect {selectedIntegration?.name}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will stop syncing data from{" "}
							{selectedIntegration?.name}. Your existing data will
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

			{/* Settings Dialog */}
			<Dialog
				open={settingsDialogOpen}
				onOpenChange={setSettingsDialogOpen}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{selectedIntegration?.name} Settings
						</DialogTitle>
						<DialogDescription>
							Configure sync frequency and view sync history
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-6 py-4">
						{/* Sync Frequency */}
						<div className="space-y-2">
							<Label htmlFor="sync-frequency">
								Sync Frequency
							</Label>
							<Select
								value={syncFrequency}
								onValueChange={setSyncFrequency}
							>
								<SelectTrigger id="sync-frequency">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="5">
										Every 5 minutes
									</SelectItem>
									<SelectItem value="15">
										Every 15 minutes
									</SelectItem>
									<SelectItem value="30">
										Every 30 minutes
									</SelectItem>
									<SelectItem value="60">
										Every hour
									</SelectItem>
									<SelectItem value="360">
										Every 6 hours
									</SelectItem>
									<SelectItem value="1440">Daily</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Test Connection */}
						<div className="space-y-2">
							<Label>Connection Test</Label>
							<Button
								variant="outline"
								className="w-full bg-transparent"
								onClick={() =>
									selectedIntegration &&
									handleTestConnection(selectedIntegration.id)
								}
								disabled={isTesting === selectedIntegration?.id}
							>
								{isTesting === selectedIntegration?.id ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Testing...
									</>
								) : (
									<>
										<Plug className="h-4 w-4 mr-2" />
										Test Connection
									</>
								)}
							</Button>
						</div>

						{/* Sync History */}
						<div className="space-y-2">
							<Label>Recent Sync History</Label>
							<div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
								{syncHistory.length > 0 ? (
									syncHistory.map((sync) => (
										<div
											key={sync.id}
											className="p-3 flex items-center justify-between text-sm"
										>
											<div className="flex items-center gap-2">
												{sync.status === "success" ? (
													<CheckCircle2 className="h-4 w-4 text-green-500" />
												) : (
													<XCircle className="h-4 w-4 text-red-500" />
												)}
												<span className="text-muted-foreground">
													{sync.timestamp}
												</span>
											</div>
											<div className="flex items-center gap-4 text-xs text-muted-foreground">
												<span>
													{sync.itemsSynced} items
												</span>
												<span>{sync.duration}</span>
											</div>
										</div>
									))
								) : (
									<div className="p-6 text-center text-sm text-muted-foreground">
										No sync history available
									</div>
								)}
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setSettingsDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleUpdateSettings}>
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
