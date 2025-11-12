"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	CheckCircle2,
	Plug,
	XCircle,
	Search,
	Filter,
	Clock,
} from "lucide-react";
import { toast } from "sonner";
import { INTEGRATIONS, mergeIntegrations } from "@/lib/oauth-utils";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@/components/integrations/connect-button";
import { DisconnectButton } from "@/components/integrations/disconnect-button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function IntegrationsPage() {
	const { integrations, loading, error, connect, fetchIntegrations } =
		useIntegrationsStore((state) => state);

	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [activeTab, setActiveTab] = useState("all");

	useEffect(() => {
		if (error) {
			toast.error(error);
		}
	}, [error]);

	const mergedIntegrations = useMemo(() => {
		if (!integrations) return INTEGRATIONS;
		return mergeIntegrations(INTEGRATIONS, integrations);
	}, [integrations]);

	// Get unique categories
	const categories = useMemo(() => {
		const cats = new Set(mergedIntegrations.map((int) => int.category));
		return ["all", ...Array.from(cats)];
	}, [mergedIntegrations]);

	// Filter integrations based on tab, search, and category
	const filteredIntegrations = useMemo(() => {
		let filtered = mergedIntegrations;

		// Filter by tab
		if (activeTab === "active") {
			filtered = filtered.filter(
				(int) => int.status === "CONNECTED" || int.status === "SYNCING"
			);
		} else if (activeTab === "inactive") {
			filtered = filtered.filter(
				(int) =>
					int.status === "DISCONNECTED" ||
					int.status === "ERROR" ||
					int.status === "PENDING_SETUP"
			);
		}

		// Filter by search query
		if (searchQuery) {
			filtered = filtered.filter((int) =>
				int.name.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		// Filter by category
		if (categoryFilter !== "all") {
			filtered = filtered.filter(
				(int) => int.category === categoryFilter
			);
		}

		return filtered;
	}, [mergedIntegrations, activeTab, searchQuery, categoryFilter]);

	// Count integrations by status
	const counts = useMemo(() => {
		const active = mergedIntegrations.filter(
			(int) => int.status === "CONNECTED" || int.status === "SYNCING"
		).length;
		const inactive = mergedIntegrations.filter(
			(int) =>
				int.status === "DISCONNECTED" ||
				int.status === "ERROR" ||
				int.status === "PENDING_SETUP"
		).length;
		return { all: mergedIntegrations.length, active, inactive };
	}, [mergedIntegrations]);

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

			{/* Tabs and Filters */}
			<div className="space-y-4">
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList>
						<TabsTrigger value="all">
							All ({counts.all})
						</TabsTrigger>
						<TabsTrigger value="active">
							Active ({counts.active})
						</TabsTrigger>
						<TabsTrigger value="inactive">
							Inactive ({counts.inactive})
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{/* Filters */}
				<div className="flex flex-col sm:flex-row gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search integrations..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select
						value={categoryFilter}
						onValueChange={setCategoryFilter}
					>
						<SelectTrigger className="w-full sm:w-[200px]">
							<Filter className="h-4 w-4 mr-2" />
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							{categories.map((cat) => (
								<SelectItem key={cat} value={cat}>
									{cat === "all"
										? "All Categories"
										: cat.charAt(0).toUpperCase() +
											cat.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Integrations Grid */}
			{filteredIntegrations.length === 0 ? (
				<Card className="p-12">
					<div className="text-center">
						<Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">
							No integrations found
						</h3>
						<p className="text-muted-foreground">
							Try adjusting your filters or search query
						</p>
					</div>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredIntegrations.map((integration) => (
						<Card key={integration.id} className="flex flex-col">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
											<Plug className="h-5 w-5 text-primary" />
										</div>
										<div>
											<CardTitle className="text-base">
												{integration.name}
											</CardTitle>
											<p className="text-xs text-muted-foreground mt-0.5">
												{integration.category}
											</p>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex-1 flex flex-col justify-between">
								<div className="mb-4">
									<div className="text-sm text-muted-foreground">
										Last sync:{" "}
										{integration.lastSyncAt
											? typeof integration.lastSyncAt ===
												"string"
												? new Date(
														integration.lastSyncAt
													).toLocaleDateString()
												: integration.lastSyncAt.toLocaleDateString()
											: "Never"}
									</div>
								</div>
								{integration.status === "CONNECTED" && (
									<div className="flex items-center justify-between gap-2">
										<Badge
											variant="outline"
											className="gap-1"
										>
											<CheckCircle2 className="h-3 w-3 text-success" />
											Connected
										</Badge>
										<DisconnectButton
											integrationId={integration.id}
											integrationName={integration.name}
											onDisconnect={fetchIntegrations}
										/>
									</div>
								)}
								{integration.status === "ERROR" && (
									<div className="flex items-center justify-between gap-2">
										<Badge
											variant="outline"
											className="gap-1 border-destructive"
										>
											<XCircle className="h-3 w-3 text-destructive" />
											Error
										</Badge>
										<ConnectButton
											buttonText="Retry"
											loading={loading}
											integration={integration}
											onConnect={connect}
										/>
									</div>
								)}
								{integration.status === "PENDING_SETUP" && (
									<div className="flex justify-end">
										<Badge
											variant="outline"
											className="gap-1 border-destructive"
										>
											<XCircle className="h-3 w-3 text-destructive" />
											Pending Setup
										</Badge>
									</div>
								)}
								{integration.status === "SYNCING" && (
									<div className="flex items-center justify-between gap-2">
										<Badge
											variant="outline"
											className="gap-1 border-yellow-500"
										>
											<Clock className="h-3 w-3 text-yellow-500" />
											Syncing
										</Badge>
										<DisconnectButton
											integrationId={integration.id}
											integrationName={integration.name}
											onDisconnect={fetchIntegrations}
										/>
									</div>
								)}
								{integration.status === "DISCONNECTED" && (
									<div className="flex justify-end">
										<ConnectButton
											buttonText="Connect"
											loading={loading}
											integration={integration}
											onConnect={connect}
										/>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
