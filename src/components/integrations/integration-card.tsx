"use client";

import { getProviderLogo, INTEGRATIONS } from "@/lib/oauth-utils";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import Image from "next/image";
import { Badge } from "../ui/badge";
import {
	CheckCircle2,
	ExternalLink,
	Loader2,
	Plug,
	RefreshCw,
	Settings,
	XCircle,
} from "lucide-react";
import { Integration, IntegrationStatus } from "@prisma/client";
import { Button } from "../ui/button";
import Link from "next/link";
import { useState } from "react";

export const IntegrationCard = ({
	integration,
	fetchIntegrations,
	handleConnect,
	onDisconnect,
}: {
	integration: Integration;
	fetchIntegrations: () => Promise<void>;
	handleConnect: (integrationId: string) => void;
	onDisconnect: (integration: Integration) => void;
}) => {
	const [isSyncing, setIsSyncing] = useState<string | null>(null);

	const name = integration.type[0].toUpperCase() + integration.type.slice(1);
	const logo = getProviderLogo(integration.type);

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
	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
							<Image src={logo} alt={name} className="h-8 w-8" />
						</div>
						<div>
							<CardTitle className="text-lg">{name}</CardTitle>
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
					nesciunt neque, libero, hic ipsa quo quibusdam vero quos!
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
							onClick={() => onDisconnect(integration)}
						>
							Disconnect
						</Button>
					</>
				) : (
					<>
						<Button
							className="flex-1"
							size="sm"
							onClick={() => handleConnect(integration.type)}
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

export const UnconnectedIntegrationCard = ({
	integration,
	handleConnect,
}: {
	integration: (typeof INTEGRATIONS)[number];
	handleConnect: (integrationId: string) => void;
}) => {
	const logo = integration.logo;
	const name = integration.name;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-3">
						<div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
							<Image src={logo} alt={name} className="h-8 w-8" />
						</div>
						<div>
							<CardTitle className="text-lg">{name}</CardTitle>
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
					{integration.description}
				</p>

				{integration.status === IntegrationStatus.active && (
					<div className="mt-4 space-y-2 text-xs">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">
								Last sync:
							</span>
							<span className="font-medium">
								{integration.lastSyncAt?.toLocaleDateString() ??
									"Never"}
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
				<Button
					className="flex-1"
					size="sm"
					onClick={() => handleConnect(integration.id)}
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
			</CardFooter>
		</Card>
	);
};
