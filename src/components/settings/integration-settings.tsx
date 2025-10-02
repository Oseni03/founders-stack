"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
	Github,
	CreditCard,
	CheckCircle2,
	AlertCircle,
	MessageSquare,
	Slack,
	LucideIcon,
} from "lucide-react";

interface Integration {
	id: string;
	name: string;
	description: string;
	icon: LucideIcon;
	status: "connected" | "disconnected";
	enabled: boolean;
	lastSync?: string;
}

export function IntegrationSettings() {
	const [integrations, setIntegrations] = useState<Integration[]>([
		{
			id: "github",
			name: "GitHub",
			description: "Sync commits, pull requests, and issues",
			icon: Github,
			status: "connected",
			enabled: true,
			lastSync: "2 minutes ago",
		},
		{
			id: "stripe",
			name: "Stripe",
			description: "Track payments and customer data",
			icon: CreditCard,
			status: "connected",
			enabled: true,
			lastSync: "5 minutes ago",
		},
		{
			id: "slack",
			name: "Slack",
			description: "Receive notifications and sync messages",
			icon: Slack,
			status: "connected",
			enabled: false,
			lastSync: "1 hour ago",
		},
		{
			id: "jira",
			name: "Jira",
			description: "Sync tasks and project management",
			icon: CheckCircle2,
			status: "connected",
			enabled: true,
			lastSync: "10 minutes ago",
		},
		{
			id: "sentry",
			name: "Sentry",
			description: "Monitor errors and performance",
			icon: AlertCircle,
			status: "disconnected",
			enabled: false,
		},
		{
			id: "zendesk",
			name: "Zendesk",
			description: "Manage support tickets and customer service",
			icon: MessageSquare,
			status: "disconnected",
			enabled: false,
		},
	]);

	const handleToggle = (id: string) => {
		setIntegrations(
			integrations.map((integration) =>
				integration.id === id
					? { ...integration, enabled: !integration.enabled }
					: integration
			)
		);
	};

	const handleConnect = (id: string) => {
		// Trigger OAuth flow or connection process
		console.log(`Connecting ${id}...`);
	};

	const handleDisconnect = (id: string) => {
		setIntegrations(
			integrations.map((integration) =>
				integration.id === id
					? { ...integration, status: "disconnected", enabled: false }
					: integration
			)
		);
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Connected Integrations</CardTitle>
					<CardDescription>
						Manage your connected services and data sources
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{integrations.map((integration) => {
						const Icon = integration.icon;
						return (
							<div
								key={integration.id}
								className="flex items-start gap-4 p-4 border rounded-lg"
							>
								<div className="p-2 rounded-lg bg-muted">
									<Icon className="h-5 w-5" />
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<h3 className="font-semibold">
											{integration.name}
										</h3>
										<Badge
											variant={
												integration.status ===
												"connected"
													? "default"
													: "outline"
											}
										>
											{integration.status}
										</Badge>
									</div>
									<p className="text-sm text-muted-foreground mb-2">
										{integration.description}
									</p>
									{integration.lastSync && (
										<p className="text-xs text-muted-foreground">
											Last synced: {integration.lastSync}
										</p>
									)}
								</div>

								<div className="flex items-center gap-2">
									{integration.status === "connected" && (
										<Switch
											checked={integration.enabled}
											onCheckedChange={() =>
												handleToggle(integration.id)
											}
										/>
									)}
									{integration.status === "connected" ? (
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												handleDisconnect(integration.id)
											}
										>
											Disconnect
										</Button>
									) : (
										<Button
											size="sm"
											onClick={() =>
												handleConnect(integration.id)
											}
										>
											Connect
										</Button>
									)}
								</div>
							</div>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}
