"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Github, Slack, FileText, AlertCircle } from "lucide-react";

export default function IntegrationsPage() {
	const availableIntegrations = [
		{
			id: "github",
			name: "GitHub",
			description:
				"Connect your repositories to track issues, PRs, and deployments",
			icon: Github,
			connected: false,
		},
		{
			id: "slack",
			name: "Slack",
			description:
				"Get notifications and insights directly in your Slack channels",
			icon: Slack,
			connected: false,
		},
		{
			id: "jira",
			name: "Jira",
			description:
				"Track project progress and team velocity across sprints",
			icon: FileText,
			connected: false,
		},
	];

	return (
		<div className="container mx-auto py-6">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Integrations
					</h1>
					<p className="text-muted-foreground">
						Connect your tools to get started
					</p>
				</div>
			</div>

			<Alert className="mb-6">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription>
					Free plan users can connect up to 3 integrations. Upgrade to
					Pro for unlimited integrations.
				</AlertDescription>
			</Alert>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{availableIntegrations.map((integration) => (
					<Card key={integration.id}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{integration.name}
							</CardTitle>
							<integration.icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-xs text-muted-foreground mb-4">
								{integration.description}
							</div>
							{integration.connected ? (
								<div className="flex items-center justify-between">
									<Badge>Connected</Badge>
									<Button variant="ghost" size="sm">
										Configure
									</Button>
								</div>
							) : (
								<Button size="sm" className="w-full">
									Connect
								</Button>
							)}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
