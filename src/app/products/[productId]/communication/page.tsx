import React, { useState, useEffect, useRef } from "react";
import {
	Search,
	Star,
	Bell,
	BellOff,
	MoreVertical,
	Paperclip,
	Smile,
	AtSign,
	Send,
	MessageSquare,
	Hash,
	Lock,
	Users,
	LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Types
interface Channel {
	id: string;
	name: string;
	description?: string;
	type: "CHANNEL" | "DM" | "THREAD";
	isPrivate: boolean;
	unreadCount: number;
	isMuted: boolean;
	isFavorite: boolean;
	lastMessageTime?: Date;
	platform: string;
}

interface Message {
	id: string;
	externalId: string;
	channelId: string;
	content: string;
	authorName: string;
	authorAvatar?: string;
	timestamp: Date;
	mentions: string[];
	reactions?: Record<string, number>;
	threadId?: string;
	hasAttachments: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	attachments?: any[];
	isPinned: boolean;
	linkedItems?: Array<{ type: string; id: string; title: string }>;
}

interface MessageGroup {
	authorName: string;
	authorAvatar?: string;
	messages: Message[];
}

// Mock Data Generator
const generateMockData = () => {
	const channels: Channel[] = [
		{
			id: "1",
			name: "engineering-team",
			type: "CHANNEL",
			isPrivate: false,
			unreadCount: 3,
			isMuted: false,
			isFavorite: true,
			platform: "slack",
		},
		{
			id: "2",
			name: "product-updates",
			type: "CHANNEL",
			isPrivate: false,
			unreadCount: 0,
			isMuted: false,
			isFavorite: true,
			platform: "slack",
		},
		{
			id: "3",
			name: "design-reviews",
			type: "CHANNEL",
			isPrivate: false,
			unreadCount: 7,
			isMuted: false,
			isFavorite: false,
			platform: "slack",
		},
		{
			id: "4",
			name: "Sarah Chen",
			type: "DM",
			isPrivate: true,
			unreadCount: 1,
			isMuted: false,
			isFavorite: false,
			platform: "slack",
		},
		{
			id: "5",
			name: "Mike Johnson",
			type: "DM",
			isPrivate: true,
			unreadCount: 0,
			isMuted: false,
			isFavorite: false,
			platform: "slack",
		},
		{
			id: "6",
			name: "general",
			type: "CHANNEL",
			isPrivate: false,
			unreadCount: 24,
			isMuted: true,
			isFavorite: false,
			platform: "slack",
		},
	];

	const messages: Message[] = [
		{
			id: "m1",
			externalId: "ext1",
			channelId: "1",
			content:
				"@you Can you review the API changes before EOD? We need to make sure the authentication flow is solid.",
			authorName: "Sarah Chen",
			authorAvatar: "👩",
			timestamp: new Date(Date.now() - 1000 * 60 * 30),
			mentions: ["@you"],
			reactions: { "👍": 2, "👀": 1 },
			hasAttachments: false,
			isPinned: false,
			linkedItems: [{ type: "pr", id: "234", title: "API Auth Changes" }],
		},
		{
			id: "m2",
			externalId: "ext2",
			channelId: "1",
			content: "Sure! Is it in PR #234?",
			authorName: "You",
			timestamp: new Date(Date.now() - 1000 * 60 * 15),
			mentions: [],
			hasAttachments: false,
			isPinned: false,
		},
		{
			id: "m3",
			externalId: "ext3",
			channelId: "1",
			content:
				"Yes, here's the link: https://github.com/company/repo/pull/234\nI've added detailed comments on the security implications.",
			authorName: "Sarah Chen",
			authorAvatar: "👩",
			timestamp: new Date(Date.now() - 1000 * 60 * 14),
			mentions: [],
			reactions: { "🔗": 1 },
			hasAttachments: false,
			isPinned: false,
			linkedItems: [{ type: "pr", id: "234", title: "API Auth Changes" }],
		},
		{
			id: "m4",
			externalId: "ext4",
			channelId: "1",
			content:
				"I can help with the review too. I implemented similar auth in the mobile app last month.",
			authorName: "Mike Johnson",
			authorAvatar: "👨",
			timestamp: new Date(Date.now() - 1000 * 60 * 10),
			mentions: [],
			hasAttachments: false,
			isPinned: false,
		},
	];

	return { channels, messages };
};

// Message Store (simplified inline version)
const useMessageStore = () => {
	const [channels, setChannels] = useState<Channel[]>([]);
	const [messages, setMessages] = useState<Message[]>([]);
	const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
		null
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const { channels: mockChannels, messages: mockMessages } =
			generateMockData();
		setChannels(mockChannels);
		setMessages(mockMessages);
		setSelectedChannelId(mockChannels[0]?.id || null);
		setLoading(false);
	}, []);

	return {
		channels,
		messages,
		selectedChannelId,
		setSelectedChannelId,
		loading,
		toggleFavorite: (channelId: string) => {
			setChannels((prev) =>
				prev.map((c) =>
					c.id === channelId ? { ...c, isFavorite: !c.isFavorite } : c
				)
			);
		},
		toggleMute: (channelId: string) => {
			setChannels((prev) =>
				prev.map((c) =>
					c.id === channelId ? { ...c, isMuted: !c.isMuted } : c
				)
			);
		},
		markAsRead: (channelId: string) => {
			setChannels((prev) =>
				prev.map((c) =>
					c.id === channelId ? { ...c, unreadCount: 0 } : c
				)
			);
		},
	};
};

// Group consecutive messages from same author
const groupMessages = (messages: Message[]): MessageGroup[] => {
	const groups: MessageGroup[] = [];
	let currentGroup: MessageGroup | null = null;

	messages.forEach((msg) => {
		if (!currentGroup || currentGroup.authorName !== msg.authorName) {
			currentGroup = {
				authorName: msg.authorName,
				authorAvatar: msg.authorAvatar,
				messages: [msg],
			};
			groups.push(currentGroup);
		} else {
			currentGroup.messages.push(msg);
		}
	});

	return groups;
};

// Components
const ChannelListItem: React.FC<{
	channel: Channel;
	isSelected: boolean;
	onClick: () => void;
	onToggleFavorite: () => void;
	onToggleMute: () => void;
}> = ({ channel, isSelected, onClick, onToggleFavorite, onToggleMute }) => {
	const [showMenu, setShowMenu] = useState(false);

	return (
		<div
			className={`px-3 py-2 rounded-lg cursor-pointer transition-colors relative group ${
				isSelected
					? "bg-blue-50 border border-blue-200"
					: "hover:bg-gray-50"
			}`}
			onClick={onClick}
		>
			<div className="flex items-center gap-2">
				<div className="flex-shrink-0">
					{channel.type === "CHANNEL" &&
						(channel.isPrivate ? (
							<Lock className="w-4 h-4 text-gray-400" />
						) : (
							<Hash className="w-4 h-4 text-gray-400" />
						))}
					{channel.type === "DM" && (
						<Users className="w-4 h-4 text-gray-400" />
					)}
					{channel.type === "THREAD" && (
						<MessageSquare className="w-4 h-4 text-gray-400" />
					)}
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span
							className={`text-sm truncate ${channel.unreadCount > 0 ? "font-semibold" : "font-normal"}`}
						>
							{channel.name}
						</span>
						{channel.isMuted && (
							<BellOff className="w-3 h-3 text-gray-400 flex-shrink-0" />
						)}
					</div>
				</div>

				<div className="flex items-center gap-1 flex-shrink-0">
					{channel.unreadCount > 0 && (
						<span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
							{channel.unreadCount}
						</span>
					)}
					{channel.isFavorite && (
						<Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
					)}

					<Button
						onClick={(e) => {
							e.stopPropagation();
							setShowMenu(!showMenu);
						}}
						className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-opacity"
					>
						<MoreVertical className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{showMenu && (
				<div className="absolute right-2 top-10 bg-white border shadow-lg rounded-lg py-1 z-10 min-w-[150px]">
					<button
						onClick={(e) => {
							e.stopPropagation();
							onToggleFavorite();
							setShowMenu(false);
						}}
						className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
					>
						<Star className="w-4 h-4" />
						{channel.isFavorite ? "Unfavorite" : "Favorite"}
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation();
							onToggleMute();
							setShowMenu(false);
						}}
						className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
					>
						{channel.isMuted ? (
							<Bell className="w-4 h-4" />
						) : (
							<BellOff className="w-4 h-4" />
						)}
						{channel.isMuted ? "Unmute" : "Mute"}
					</button>
				</div>
			)}
		</div>
	);
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
	const isFromYou = message.authorName === "You";

	return (
		<div className="group hover:bg-gray-50 px-4 py-1 -mx-4">
			<div className="text-xs text-gray-500 mb-1">
				{message.timestamp.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				})}
			</div>
			<div className="text-sm text-gray-900 whitespace-pre-wrap">
				{message.content}
			</div>

			{message.linkedItems && message.linkedItems.length > 0 && (
				<div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
					<div className="flex items-center gap-1 text-blue-700">
						<LinkIcon className="w-3 h-3" />
						Linked: {message.linkedItems[0].type.toUpperCase()} #
						{message.linkedItems[0].id} -{" "}
						{message.linkedItems[0].title}
					</div>
				</div>
			)}

			{message.reactions && Object.keys(message.reactions).length > 0 && (
				<div className="flex gap-2 mt-2">
					{Object.entries(message.reactions).map(([emoji, count]) => (
						<Button
							key={emoji}
							className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs flex items-center gap-1"
						>
							{emoji} {count}
						</Button>
					))}
				</div>
			)}

			<div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
				<Button className="text-xs text-gray-500 hover:text-gray-700">
					💬 Reply
				</Button>
				<Button className="text-xs text-gray-500 hover:text-gray-700">
					📌 Pin
				</Button>
				<Button className="text-xs text-gray-500 hover:text-gray-700">
					🔗 Link
				</Button>
			</div>
		</div>
	);
};

const MessageGroup: React.FC<{ group: MessageGroup }> = ({ group }) => {
	return (
		<div className="py-3">
			<div className="flex gap-3">
				<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white flex-shrink-0">
					{group.authorAvatar || group.authorName[0]}
				</div>
				<div className="flex-1 min-w-0">
					<div className="font-semibold text-sm mb-2">
						{group.authorName}
					</div>
					<div className="space-y-2">
						{group.messages.map((msg) => (
							<MessageBubble key={msg.id} message={msg} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

// Main Component
const MessagesPage: React.FC = () => {
	const {
		channels,
		messages,
		selectedChannelId,
		setSelectedChannelId,
		loading,
		toggleFavorite,
		toggleMute,
		markAsRead,
	} = useMessageStore();

	const [searchQuery, setSearchQuery] = useState("");
	const [filterView, setFilterView] = useState<
		"all" | "unread" | "favorites"
	>("all");
	const [messageText, setMessageText] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const selectedChannel = channels.find((c) => c.id === selectedChannelId);
	const channelMessages = messages.filter(
		(m) => m.channelId === selectedChannelId
	);
	const messageGroups = groupMessages(channelMessages);

	const filteredChannels = channels.filter((channel) => {
		if (
			searchQuery &&
			!channel.name.toLowerCase().includes(searchQuery.toLowerCase())
		) {
			return false;
		}
		if (filterView === "unread" && channel.unreadCount === 0) return false;
		if (filterView === "favorites" && !channel.isFavorite) return false;
		return true;
	});

	const favoriteChannels = filteredChannels.filter((c) => c.isFavorite);
	const unreadChannels = filteredChannels.filter(
		(c) => c.unreadCount > 0 && !c.isFavorite
	);
	const otherChannels = filteredChannels.filter(
		(c) => !c.isFavorite && c.unreadCount === 0
	);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [channelMessages]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				Loading...
			</div>
		);
	}

	return (
		<div className="flex h-screen bg-white">
			{/* Left Sidebar - Channels */}
			<div className="w-64 border-r border-gray-200 flex flex-col">
				<div className="p-4 border-b">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search channels..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div className="flex gap-2 mt-3">
						<Button
							onClick={() => setFilterView("all")}
							className={`flex-1 px-2 py-1 text-xs rounded ${filterView === "all" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
						>
							All
						</Button>
						<Button
							onClick={() => setFilterView("unread")}
							className={`flex-1 px-2 py-1 text-xs rounded ${filterView === "unread" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
						>
							Unread
						</Button>
						<Button
							onClick={() => setFilterView("favorites")}
							className={`flex-1 px-2 py-1 text-xs rounded ${filterView === "favorites" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
						>
							⭐
						</Button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-3 space-y-4">
					{favoriteChannels.length > 0 && (
						<div>
							<div className="text-xs font-semibold text-gray-500 mb-2 px-3">
								FAVORITES
							</div>
							<div className="space-y-1">
								{favoriteChannels.map((channel) => (
									<ChannelListItem
										key={channel.id}
										channel={channel}
										isSelected={
											channel.id === selectedChannelId
										}
										onClick={() => {
											setSelectedChannelId(channel.id);
											if (channel.unreadCount > 0)
												markAsRead(channel.id);
										}}
										onToggleFavorite={() =>
											toggleFavorite(channel.id)
										}
										onToggleMute={() =>
											toggleMute(channel.id)
										}
									/>
								))}
							</div>
						</div>
					)}

					{unreadChannels.length > 0 && (
						<div>
							<div className="text-xs font-semibold text-gray-500 mb-2 px-3">
								UNREAD
							</div>
							<div className="space-y-1">
								{unreadChannels.map((channel) => (
									<ChannelListItem
										key={channel.id}
										channel={channel}
										isSelected={
											channel.id === selectedChannelId
										}
										onClick={() => {
											setSelectedChannelId(channel.id);
											markAsRead(channel.id);
										}}
										onToggleFavorite={() =>
											toggleFavorite(channel.id)
										}
										onToggleMute={() =>
											toggleMute(channel.id)
										}
									/>
								))}
							</div>
						</div>
					)}

					{otherChannels.length > 0 && (
						<div>
							<div className="text-xs font-semibold text-gray-500 mb-2 px-3">
								CHANNELS
							</div>
							<div className="space-y-1">
								{otherChannels.map((channel) => (
									<ChannelListItem
										key={channel.id}
										channel={channel}
										isSelected={
											channel.id === selectedChannelId
										}
										onClick={() =>
											setSelectedChannelId(channel.id)
										}
										onToggleFavorite={() =>
											toggleFavorite(channel.id)
										}
										onToggleMute={() =>
											toggleMute(channel.id)
										}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Main Content - Messages */}
			<div className="flex-1 flex flex-col">
				{/* Header */}
				<div className="h-14 border-b flex items-center justify-between px-4">
					<div className="flex items-center gap-3">
						{selectedChannel && (
							<>
								{selectedChannel.type === "CHANNEL" &&
									(selectedChannel.isPrivate ? (
										<Lock className="w-5 h-5" />
									) : (
										<Hash className="w-5 h-5" />
									))}
								{selectedChannel.type === "DM" && (
									<Users className="w-5 h-5" />
								)}
								<div>
									<h2 className="font-semibold">
										{selectedChannel?.name}
									</h2>
									<p className="text-xs text-gray-500">
										{selectedChannel?.description}
									</p>
								</div>
							</>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={() =>
								selectedChannelId &&
								toggleFavorite(selectedChannelId)
							}
							className="p-2 hover:bg-gray-100 rounded-lg"
						>
							<Star
								className={`w-5 h-5 ${selectedChannel?.isFavorite ? "fill-yellow-500 text-yellow-500" : ""}`}
							/>
						</Button>
						<Button
							onClick={() =>
								selectedChannelId &&
								toggleMute(selectedChannelId)
							}
							className="p-2 hover:bg-gray-100 rounded-lg"
						>
							{selectedChannel?.isMuted ? (
								<BellOff className="w-5 h-5" />
							) : (
								<Bell className="w-5 h-5" />
							)}
						</Button>
						<Button className="p-2 hover:bg-gray-100 rounded-lg">
							<MoreVertical className="w-5 h-5" />
						</Button>
					</div>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4">
					{messageGroups.map((group, index) => (
						<MessageGroup key={index} group={group} />
					))}
					<div ref={messagesEndRef} />
				</div>

				{/* Message Composer */}
				<div className="border-t p-4">
					<div className="flex gap-2">
						<div className="flex-1 border rounded-lg p-3">
							<textarea
								value={messageText}
								onChange={(e) => setMessageText(e.target.value)}
								placeholder={`Message #${selectedChannel?.name}`}
								className="w-full resize-none focus:outline-none text-sm"
								rows={3}
							/>
							<div className="flex items-center gap-2 mt-2">
								<Button className="p-1 hover:bg-gray-100 rounded">
									<Paperclip className="w-4 h-4 text-gray-500" />
								</Button>
								<Button className="p-1 hover:bg-gray-100 rounded">
									<Smile className="w-4 h-4 text-gray-500" />
								</Button>
								<Button className="p-1 hover:bg-gray-100 rounded">
									<AtSign className="w-4 h-4 text-gray-500" />
								</Button>
								<Button className="p-1 hover:bg-gray-100 rounded">
									<LinkIcon className="w-4 h-4 text-gray-500" />
								</Button>
							</div>
						</div>
						<Button className="px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2">
							<Send className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* Right Sidebar - Context (shown when message selected) */}
			<div className="w-80 border-l border-gray-200 p-4 hidden lg:block">
				<h3 className="font-semibold mb-4">Message Details</h3>
				<div className="text-sm text-gray-500">
					Select a message to see details and related items
				</div>
			</div>
		</div>
	);
};

export default MessagesPage;
