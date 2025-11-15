/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Channel {
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
	externalId: string;
	integrationId: string;
	organizationId: string;
	attributes?: Record<string, any>;
	memberCount?: number;
}

export interface Message {
	id: string;
	externalId: string;
	channelId: string;
	channelName: string;
	channelType: string;
	content: string;
	authorId?: string;
	authorName: string;
	authorAvatar?: string;
	mentions: string[];
	reactions?: Record<string, number>;
	threadId?: string;
	parentMessageId?: string;
	hasAttachments: boolean;
	attachments?: any[];
	isPinned: boolean;
	isImportant: boolean;
	url?: string;
	timestamp: Date;
	platform: string;
	integrationId: string;
	linkedItems?: Array<{
		type: string;
		id: string;
		title: string;
		url?: string;
	}>;
}

export interface Thread {
	id: string;
	channelId: string;
	channelName: string;
	parentMessageId: string;
	participants: string[];
	messageCount: number;
	lastActivity: Date;
	preview: string;
}

export interface MessageFilter {
	showUnreadOnly: boolean;
	showMentionsOnly: boolean;
	showFavoritesOnly: boolean;
	showThreadsOnly: boolean;
	platforms: string[];
	dateRange?: { start: Date; end: Date };
}

export interface CommunicationStats {
	totalMessages: number;
	unreadMessages: number;
	totalMentions: number;
	activeThreads: number;
	channelCount: number;
	messageVolumeTrend: Array<{
		date: string;
		count: number;
		mentions: number;
	}>;
}
