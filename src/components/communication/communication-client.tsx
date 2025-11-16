// app/messages/messages-client.tsx
"use client";

import { useEffect } from "react";
import { useCommunicationStore } from "@/zustand/providers/communication-store-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Message } from "@prisma/client";

interface CommunicationClientProps {
	initialMessages: Message[];
}

export default function CommunicationClient({
	initialMessages,
}: CommunicationClientProps) {
	const {
		messages,
		channels,
		selectedChannel,
		filters,
		setMessages,
		setChannels,
		setSelectedChannel,
		setFilters,
	} = useCommunicationStore((state) => state);

	useEffect(() => {
		setMessages(initialMessages);
		// Derive channels from messages (group by channelId)
		const derivedChannels = initialMessages.reduce(
			(acc, msg) => {
				const existing = acc.find((ch) => ch.id === msg.channelId);
				if (!existing) {
					acc.push({
						id: msg.channelId,
						name: msg.channelName,
						type: msg.channelType,
						unreadCount: 1, // Placeholder; compute based on read status
					});
				}
				return acc;
			},
			[] as Array<{
				id: string;
				name: string;
				type: string;
				unreadCount: number;
			}>
		);
		setChannels(derivedChannels);
	}, [initialMessages, setMessages, setChannels]);

	const filteredChannels = channels.filter(
		(ch) =>
			ch.name.toLowerCase().includes(filters.search.toLowerCase()) &&
			(!filters.unreadOnly || ch.unreadCount > 0)
	);

	const channelMessages = messages.filter(
		(msg) => msg.channelId === selectedChannel
	);

	return (
		<div className="grid grid-cols-1 md:grid-cols-[300px_1fr_300px] gap-4 h-[calc(100vh-80px)]">
			{/* Left Sidebar - Channel List */}
			<Card className="overflow-y-auto shadow-sm border-muted">
				<CardHeader className="p-4 border-b border-muted">
					<Input
						placeholder="Search channels..."
						value={filters.search}
						onChange={(e) => setFilters({ search: e.target.value })}
						className="w-full"
					/>
					<div className="flex items-center gap-2 mt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setFilters({ unreadOnly: !filters.unreadOnly })
							}
							className={cn(
								filters.unreadOnly &&
									"bg-primary text-primary-foreground"
							)}
						>
							Unread Only
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<ul className="divide-y divide-muted">
						{filteredChannels.map((ch) => (
							<li
								key={ch.id}
								className={cn(
									"p-4 cursor-pointer hover:bg-muted/50 transition-colors",
									selectedChannel === ch.id && "bg-muted"
								)}
								onClick={() => setSelectedChannel(ch.id)}
							>
								<div className="flex justify-between items-center">
									<span className="font-medium text-foreground">
										{ch.name}
									</span>
									{ch.unreadCount > 0 && (
										<Badge variant="secondary">
											{ch.unreadCount}
										</Badge>
									)}
								</div>
								<span className="text-sm text-muted-foreground">
									{ch.type}
								</span>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>

			{/* Main Content - Message Thread */}
			<Card className="overflow-y-auto shadow-sm border-muted">
				<CardHeader className="p-4 border-b border-muted flex justify-between items-center">
					<h2 className="font-semibold text-foreground">
						{selectedChannel
							? channels.find((ch) => ch.id === selectedChannel)
									?.name
							: "Select a channel"}
					</h2>
					<div className="flex gap-2">
						<Button variant="ghost" size="sm">
							Mute
						</Button>
						<Button variant="ghost" size="sm">
							Star
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-4 space-y-4">
					{channelMessages.map((msg) => (
						<div
							key={msg.id}
							className="border-b border-muted pb-4"
						>
							<div className="flex items-center gap-2">
								<span className="font-medium text-foreground">
									{msg.authorName}
								</span>
								<span className="text-sm text-muted-foreground">
									{new Date(
										msg.timestamp
									).toLocaleTimeString()}
								</span>
							</div>
							<p className="text-foreground">{msg.content}</p>
							{msg.reactions && (
								<div className="flex gap-2 mt-2">
									{/* Render reactions */}
								</div>
							)}
						</div>
					))}
				</CardContent>
				{/* Message Composer */}
				<div className="p-4 border-t border-muted">
					<Input placeholder="Type a message..." className="w-full" />
				</div>
			</Card>

			{/* Right Sidebar - Context Panel */}
			<Card className="overflow-y-auto shadow-sm border-muted hidden md:block">
				<CardHeader className="p-4 border-b border-muted">
					<h2 className="font-semibold text-foreground">Context</h2>
				</CardHeader>
				<CardContent className="p-4">
					{/* Placeholder for selected message details, related items, actions */}
					<p className="text-muted-foreground">
						Select a message for details
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
