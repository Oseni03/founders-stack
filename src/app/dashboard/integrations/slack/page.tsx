"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Slack,
	MessageSquare,
	Hash,
	Users,
	RefreshCw,
	Settings,
	CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Integration, IntegrationStatus } from "@prisma/client";
import { useOrganizationStore } from "@/zustand/providers/organization-store-provider";
import { getIntegration } from "@/server/integrations";

interface SlackChannel {
	id: string;
	name: string;
	is_private: boolean;
	is_member: boolean;
	num_members: number;
}

interface SlackMessage {
	id: string;
	text: string;
	user: string;
	timestamp: string;
	channel: string;
	reactions?: number;
}

export default function SlackIntegrationPage() {
	const activeOrganization = useOrganizationStore(
		(state) => state.activeOrganization
	)!;
	const [integration, setIntegration] = useState<Integration | null>(null);

	const [isConnected, setIsConnected] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);
	const [channels, setChannels] = useState<SlackChannel[]>([]);
	const [messages, setMessages] = useState<SlackMessage[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<string>("");
	const [workspaceName, setWorkspaceName] = useState("");

	useEffect(() => {
		const fetchIntegration = async () => {
			try {
				const data = await getIntegration(
					activeOrganization.id,
					"slack"
				);

				if (data) setIntegration(data);

				setIsConnected(data?.status === IntegrationStatus.active);
				if (data?.status === IntegrationStatus.active) {
					loadChannels();
				}
			} catch (error) {
				console.error("Failed to check Slack connection:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchIntegration();
	}, [activeOrganization.id]);

	useEffect(() => {
		if (selectedChannel) {
			loadMessages(selectedChannel);
		}
	}, [selectedChannel]);

	const loadChannels = async () => {
		try {
			if (!integration) return;
			const response = await fetch(
				`/api/integrations/slack/channels?integration=${integration.id}`
			);
			const data = await response.json();
			setChannels(data.channels || []);
			if (data.channels?.length > 0) {
				setSelectedChannel(data.channels[0].id);
			}
		} catch (error) {
			console.error("Failed to load channels:", error);
		}
	};

	const loadMessages = async (channelId: string) => {
		try {
			if (!integration) return;
			const response = await fetch(
				`/api/integrations/slack/messages?channel=${channelId}&integration=${integration.id}`
			);
			const data = await response.json();
			setMessages(data.messages || []);
		} catch (error) {
			console.error("Failed to load messages:", error);
		}
	};

	const handleConnect = async () => {
		try {
			const resp = await fetch(`/api/integrations/slack/connect`);
			if (resp.ok) {
				const data = await resp.json();
				if (data.url) {
					window.location.href = data.url;
				}
			} else {
				toast.error(`Failed to connect Slack`);
			}
		} catch (error) {
			console.error("Failed to connect slack:", error);
			toast.error(`Failed to connect Slack`);
		}
	};

	const handleDisconnect = async () => {
		try {
			if (!integration) return;
			const response = await fetch("/api/integrations/slack/disconnect", {
				method: "POST",
				body: JSON.stringify({ integrationId: integration.id }),
			});

			if (response.ok) {
				setIsConnected(false);
				setIntegration(null);
				setChannels([]);
				setMessages([]);
				toast.info("Disconnected from Slack", {
					description: "Your Slack integration has been removed.",
				});
			}
		} catch (error) {
			console.error("Failed to disconnect from Slack:", error);
			toast.error("Error", {
				description: "Failed to disconnect from Slack.",
			});
		}
	};

	const handleSync = async () => {
		setIsSyncing(true);
		try {
			const response = await fetch("/api/integrations/slack/sync", {
				method: "POST",
			});

			if (response.ok) {
				const data = await response.json();
				toast.success("Sync complete", {
					description: `Synced ${data.message_count} messages from Slack.`,
				});
				if (selectedChannel) {
					loadMessages(selectedChannel);
				}
			}
		} catch (error) {
			console.error("Failed to sync Slack messages:", error);
			toast.error("Error", {
				description: "Failed to sync Slack messages.",
			});
		} finally {
			setIsSyncing(false);
		}
	};

	if (isLoading) {
		return (
			<div className="p-4 md:p-6 lg:p-8">
				<Skeleton className="h-12 w-64 mb-8" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!isConnected) {
		return (
			<div className="p-4 md:p-6 lg:p-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight text-balance mb-2">
						Slack Integration
					</h1>
					<p className="text-muted-foreground text-balance">
						Connect your Slack workspace to sync messages
					</p>
				</div>

				<Card className="max-w-2xl">
					<CardHeader>
						<div className="flex items-center gap-4">
							<div className="p-3 rounded-lg bg-muted">
								<Slack className="h-8 w-8" />
							</div>
							<div>
								<CardTitle>Connect to Slack</CardTitle>
								<CardDescription>
									Sync messages and send notifications
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-4">
							<h3 className="font-semibold">
								What you&rsquo;ll get:
							</h3>
							<ul className="space-y-2">
								<li className="flex items-start gap-2">
									<CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" />
									<span className="text-sm">
										Sync messages from all your channels
									</span>
								</li>
								<li className="flex items-start gap-2">
									<CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" />
									<span className="text-sm">
										Search Slack messages from the global
										search
									</span>
								</li>
								<li className="flex items-start gap-2">
									<CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" />
									<span className="text-sm">
										Send notifications to Slack channels
									</span>
								</li>
								<li className="flex items-start gap-2">
									<CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" />
									<span className="text-sm">
										View message analytics and trends
									</span>
								</li>
							</ul>
						</div>

						<Button
							onClick={handleConnect}
							className="w-full gap-2"
							size="lg"
						>
							<Slack className="h-5 w-5" />
							Connect Slack Workspace
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="p-4 md:p-6 lg:p-8">
			<div className="mb-8">
				<div className="flex items-center justify-between mb-2">
					<h1 className="text-3xl font-bold tracking-tight text-balance">
						Slack Integration
					</h1>
					<Badge variant="default" className="gap-1">
						<CheckCircle2 className="h-3 w-3" />
						Connected
					</Badge>
				</div>
				<p className="text-muted-foreground text-balance">
					Connected to{" "}
					<span className="font-medium">{workspaceName}</span>
				</p>
			</div>

			<div className="grid gap-6 mb-6 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">
							Channels
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{channels.length}
						</div>
						<p className="text-xs text-muted-foreground">
							Available channels
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">
							Messages Synced
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">1,247</div>
						<p className="text-xs text-muted-foreground">
							Last 30 days
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">
							Last Sync
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{integration?.lastSyncAt?.toString()}
						</div>
						<p className="text-xs text-muted-foreground">ago</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-1">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Hash className="h-4 w-4" />
							Channels
						</CardTitle>
						<CardDescription>
							Select a channel to view messages
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{channels.map((channel) => (
								<Button
									key={channel.id}
									onClick={() =>
										setSelectedChannel(channel.id)
									}
									className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
										selectedChannel === channel.id
											? "bg-primary text-primary-foreground border-primary"
											: "hover:bg-muted"
									}`}
								>
									<div className="flex items-center gap-2">
										<Hash className="h-4 w-4" />
										<span className="font-medium">
											{channel.name}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<Users className="h-3 w-3" />
										<span className="text-xs">
											{channel.num_members}
										</span>
									</div>
								</Button>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<MessageSquare className="h-4 w-4" />
								Messages
							</CardTitle>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleSync}
									disabled={isSyncing}
								>
									<RefreshCw
										className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
									/>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleDisconnect}
								>
									<Settings className="h-4 w-4" />
								</Button>
							</div>
						</div>
						<CardDescription>
							{selectedChannel &&
								`#${channels.find((c) => c.id === selectedChannel)?.name}`}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4 max-h-[600px] overflow-y-auto">
							{messages.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground">
									<MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
									<p>No messages found in this channel</p>
								</div>
							) : (
								messages.map((message) => (
									<div
										key={message.id}
										className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-start justify-between mb-2">
											<span className="font-medium">
												{message.user}
											</span>
											<span className="text-xs text-muted-foreground">
												{message.timestamp}
											</span>
										</div>
										<p className="text-sm">
											{message.text}
										</p>
										{message.reactions &&
											message.reactions > 0 && (
												<div className="mt-2">
													<Badge
														variant="outline"
														className="text-xs"
													>
														{message.reactions}{" "}
														reactions
													</Badge>
												</div>
											)}
									</div>
								))
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
