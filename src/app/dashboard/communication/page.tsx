// app/communication/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
	ArrowLeft,
	MessageCircle,
	Bell,
	TrendingUp,
	Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { ChannelManager } from "@/components/dashboard/channel-manager";
import { useCommunicationStore } from "@/zustand/providers/communication-store-provider";
import { toast } from "sonner";

export default function CommunicationPage() {
	const {
		data,
		loading,
		selectedChannelId,
		showAllMessages,
		setData,
		setLoading,
		setSelectedChannelId,
		setShowAllMessages,
		addChannel,
		removeChannel,
	} = useCommunicationStore((state) => state);

	useEffect(() => {
		fetchMetrics();
	}, []);

	const fetchMetrics = async () => {
		try {
			setLoading(true);
			const response = await fetch(`/api/communication?range=30d`);

			if (!response.ok) throw new Error("Failed to fetch metrics");

			const fetchedData = await response.json();
			setData(fetchedData);
		} catch (err) {
			console.error("[Communication] Fetch error:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleAddChannel = async (name: string, description: string) => {
		try {
			console.log("Creating channel:", name, description);

			// const newChannel = {
			// 	id: result.channel.id,
			// 	name: result.channel.name,
			// 	description: result.channel.description || "",
			// };

			// addChannel(newChannel);
		} catch (err) {
			console.error("[Communication] Create channel error:", err);
			toast.error("Failed to create channel");
		}
	};

	const handleDeleteChannel = async (channelId: string) => {
		try {
			const response = await fetch("/api/communication", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "deleteChannel",
					data: { channelId },
				}),
			});

			if (!response.ok) throw new Error("Failed to delete channel");

			removeChannel(channelId);
		} catch (err) {
			console.error("[Communication] Delete channel error:", err);
			toast.error("Failed to delete channel");
		}
	};

	const sentimentColor = useMemo(() => {
		if (!data) return "text-gray-500";
		return data.sentiment >= 0.7
			? "text-green-500"
			: data.sentiment >= 0.4
				? "text-yellow-500"
				: "text-red-500";
	}, [data?.sentiment]);

	const messageVolumeTrendData = useMemo(
		() =>
			Array.from({ length: 7 }, (_, i) => ({
				name: `Day ${i + 1}`,
				messages: Math.floor(Math.random() * 500) + 200,
				mentions: Math.floor(Math.random() * 50) + 10,
			})),
		[]
	);

	const channelActivityData = useMemo(() => {
		if (!data) return [];
		return data.channels.map((channel) => ({
			name: channel.name,
			messages: data.messagesByChannel[channel.id]?.length || 0,
		}));
	}, [data?.channels, data?.messagesByChannel]);

	const displayedMessages = useMemo(() => {
		if (!data) return [];
		return showAllMessages
			? Object.values(data.messagesByChannel).flat()
			: selectedChannelId
				? data.messagesByChannel[selectedChannelId] || []
				: [];
	}, [data?.messagesByChannel, showAllMessages, selectedChannelId]);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
					<p className="text-muted-foreground">
						Loading communication data...
					</p>
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center">
					<p className="mb-4 text-lg font-semibold text-destructive">
						Failed to load communication data
					</p>
					<Link href="/dashboard">
						<Button>Back to Dashboard</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Header with Back Button */}
				<div className="mb-8 flex items-center gap-4">
					<Link href="/dashboard">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div className="flex-1">
						<h1 className="text-3xl font-bold text-foreground">
							Communication
						</h1>
						<p className="mt-1 text-muted-foreground">
							Team messaging and collaboration metrics
						</p>
					</div>
					<Button onClick={fetchMetrics} variant="outline">
						Refresh
					</Button>
				</div>

				<div className="grid gap-8 lg:grid-cols-4">
					<div className="lg:col-span-1">
						<Card className="sticky top-8">
							<CardHeader className="pb-4">
								<CardTitle className="text-base">
									Channels
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ChannelManager
									channels={data.channels}
									selectedChannelId={selectedChannelId || ""}
									onSelectChannel={setSelectedChannelId}
									onAddChannel={handleAddChannel}
									onDeleteChannel={handleDeleteChannel}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3 space-y-8">
						{/* Key Metrics Grid */}
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="flex items-center gap-2 text-sm font-medium">
										<MessageCircle className="h-4 w-4 text-chart-1" />
										Message Volume
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-3xl font-bold">
										{data.messageVolume.toLocaleString()}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Messages this period
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="flex items-center gap-2 text-sm font-medium">
										<Bell className="h-4 w-4 text-chart-2" />
										Unread Mentions
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-3xl font-bold text-orange-500">
										{data.unreadMentions}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Require attention
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="flex items-center gap-2 text-sm font-medium">
										<TrendingUp
											className={`h-4 w-4 ${sentimentColor}`}
										/>
										Team Sentiment
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p
										className={`text-3xl font-bold ${sentimentColor}`}
									>
										{Math.round(data.sentiment * 100)}%
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Overall sentiment
									</p>
								</CardContent>
							</Card>
						</div>

						{/* Charts Grid */}
						<div className="grid gap-6 lg:grid-cols-2">
							{/* Message Volume & Mentions Trend */}
							<Card>
								<CardHeader>
									<CardTitle>
										Message Volume & Mentions
									</CardTitle>
									<CardDescription>
										Communication activity over the last 7
										days
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="h-80 w-full">
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<BarChart
												data={messageVolumeTrendData}
											>
												<CartesianGrid
													strokeDasharray="3 3"
													stroke="var(--border)"
												/>
												<XAxis
													dataKey="name"
													stroke="var(--muted-foreground)"
												/>
												<YAxis stroke="var(--muted-foreground)" />
												<Tooltip
													contentStyle={{
														backgroundColor:
															"var(--card)",
														border: "1px solid var(--border)",
														borderRadius:
															"var(--radius)",
													}}
												/>
												<Bar
													dataKey="messages"
													fill="var(--chart-1)"
													name="Messages"
												/>
												<Bar
													dataKey="mentions"
													fill="var(--chart-2)"
													name="Mentions"
												/>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</CardContent>
							</Card>

							{/* Channel Activity */}
							<Card>
								<CardHeader>
									<CardTitle>Channel Activity</CardTitle>
									<CardDescription>
										Message distribution across channels
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="h-80 w-full">
										<ResponsiveContainer
											width="100%"
											height="100%"
										>
											<BarChart
												data={channelActivityData}
												layout="vertical"
											>
												<CartesianGrid
													strokeDasharray="3 3"
													stroke="var(--border)"
												/>
												<XAxis
													type="number"
													stroke="var(--muted-foreground)"
												/>
												<YAxis
													dataKey="name"
													type="category"
													stroke="var(--muted-foreground)"
													width={80}
												/>
												<Tooltip
													contentStyle={{
														backgroundColor:
															"var(--card)",
														border: "1px solid var(--border)",
														borderRadius:
															"var(--radius)",
													}}
													formatter={(value) =>
														`${value} messages`
													}
												/>
												<Bar
													dataKey="messages"
													fill="var(--chart-3)"
												/>
											</BarChart>
										</ResponsiveContainer>
									</div>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>
											{showAllMessages
												? "All Messages"
												: `#${data.channels.find((c) => c.id === selectedChannelId)?.name}`}
										</CardTitle>
										<CardDescription>
											{displayedMessages.length} message
											{displayedMessages.length !== 1
												? "s"
												: ""}
										</CardDescription>
									</div>
									<Button
										size="sm"
										variant={
											showAllMessages
												? "default"
												: "outline"
										}
										onClick={() =>
											setShowAllMessages(!showAllMessages)
										}
										className="gap-2"
									>
										<Filter className="h-4 w-4" />
										{showAllMessages
											? "View All"
											: "Filter"}
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="space-y-3 max-h-96 overflow-y-auto">
									{displayedMessages.length > 0 ? (
										displayedMessages.map((msg) => (
											<div
												key={msg.id}
												className="rounded-lg border border-border p-4"
											>
												<div className="mb-2 flex items-center justify-between">
													<div className="flex items-center gap-2">
														<span className="font-medium text-foreground">
															@{msg.user}
														</span>
														<span className="text-xs text-muted-foreground">
															in #
															{
																data.channels.find(
																	(c) =>
																		c.id ===
																		msg.channelId
																)?.name
															}
														</span>
													</div>
													<span className="text-xs text-muted-foreground">
														{new Date(
															msg.timestamp
														).toLocaleTimeString()}
													</span>
												</div>
												<p className="text-sm text-muted-foreground">
													{msg.text}
												</p>
											</div>
										))
									) : (
										<p className="text-center text-muted-foreground py-8">
											No messages in this channel
										</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Insights */}
						<Card>
							<CardHeader>
								<CardTitle>Key Insights</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
									<p className="font-medium">Analysis:</p>
									<p className="mt-2">{data.insight}</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</main>
	);
}
