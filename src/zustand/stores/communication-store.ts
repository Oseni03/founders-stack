import {
	Channel,
	CommunicationStats,
	Message,
	MessageFilter,
	Thread,
} from "@/types/communication";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface CommunicationState {
	// Data
	channels: Channel[];
	messages: Record<string, Message[]>; // channelId -> messages
	threads: Thread[];
	stats: CommunicationStats | null;

	// UI State
	selectedChannelId: string | null;
	selectedMessageId: string | null;
	filter: MessageFilter;
	searchQuery: string;
	loading: boolean;
	error: string | null;

	// Pagination
	hasMore: Record<string, boolean>; // channelId -> hasMore
	loadingMore: Record<string, boolean>;

	// Actions - Data Management
	setChannels: (channels: Channel[]) => void;
	addChannel: (channel: Channel) => void;
	updateChannel: (channelId: string, updates: Partial<Channel>) => void;
	removeChannel: (channelId: string) => void;

	setMessages: (channelId: string, messages: Message[]) => void;
	addMessage: (message: Message) => void;
	updateMessage: (messageId: string, updates: Partial<Message>) => void;
	removeMessage: (messageId: string) => void;
	appendMessages: (channelId: string, messages: Message[]) => void;

	setThreads: (threads: Thread[]) => void;
	updateThread: (threadId: string, updates: Partial<Thread>) => void;

	setStats: (stats: CommunicationStats) => void;

	// Actions - UI
	setSelectedChannelId: (channelId: string | null) => void;
	setSelectedMessageId: (messageId: string | null) => void;
	setFilter: (filter: Partial<MessageFilter>) => void;
	resetFilter: () => void;
	setSearchQuery: (query: string) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;

	// Actions - User Interactions
	toggleFavorite: (channelId: string) => void;
	toggleMute: (channelId: string) => void;
	togglePinMessage: (messageId: string) => void;
	toggleImportantMessage: (messageId: string) => void;
	markChannelAsRead: (channelId: string) => void;
	markAllAsRead: () => void;
	addReaction: (messageId: string, emoji: string) => void;
	removeReaction: (messageId: string, emoji: string) => void;

	// Actions - Pagination
	setHasMore: (channelId: string, hasMore: boolean) => void;
	setLoadingMore: (channelId: string, loading: boolean) => void;

	// Utilities
	getChannelById: (channelId: string) => Channel | undefined;
	getMessageById: (messageId: string) => Message | undefined;
	getChannelMessages: (channelId: string) => Message[];
	getUnreadChannels: () => Channel[];
	getFavoriteChannels: () => Channel[];
	getFilteredChannels: () => Channel[];

	reset: () => void;
}

const defaultFilter: MessageFilter = {
	showUnreadOnly: false,
	showMentionsOnly: false,
	showFavoritesOnly: false,
	showThreadsOnly: false,
	platforms: [],
};

const initialState = {
	channels: [],
	messages: {},
	threads: [],
	stats: null,
	selectedChannelId: null,
	selectedMessageId: null,
	filter: defaultFilter,
	searchQuery: "",
	loading: true,
	error: null,
	hasMore: {},
	loadingMore: {},
};

export const createCommunicationStore = () => {
	return create<CommunicationState>()(
		persist(
			immer((set, get) => ({
				...initialState,

				// Data Management
				setChannels: (channels) => {
					set((state) => {
						state.channels = channels.sort((a, b) => {
							if (a.isFavorite && !b.isFavorite) return -1;
							if (!a.isFavorite && b.isFavorite) return 1;
							if (a.unreadCount > 0 && b.unreadCount === 0)
								return -1;
							if (a.unreadCount === 0 && b.unreadCount > 0)
								return 1;
							return (
								b.lastMessageTime?.getTime() ??
								0 - (a.lastMessageTime?.getTime() ?? 0)
							);
						});
						state.loading = false;
					});
				},

				addChannel: (channel) => {
					set((state) => {
						const exists = state.channels.find(
							(c) => c.id === channel.id
						);
						if (!exists) {
							state.channels.push(channel);
							state.messages[channel.id] = [];
						}
					});
				},

				updateChannel: (channelId, updates) => {
					set((state) => {
						const index = state.channels.findIndex(
							(c) => c.id === channelId
						);
						if (index !== -1) {
							state.channels[index] = {
								...state.channels[index],
								...updates,
							};
						}
					});
				},

				removeChannel: (channelId) => {
					set((state) => {
						state.channels = state.channels.filter(
							(c) => c.id !== channelId
						);
						delete state.messages[channelId];
						if (state.selectedChannelId === channelId) {
							state.selectedChannelId =
								state.channels[0]?.id || null;
						}
					});
				},

				setMessages: (channelId, messages) => {
					set((state) => {
						state.messages[channelId] = messages.sort(
							(a, b) =>
								a.timestamp.getTime() - b.timestamp.getTime()
						);
					});
				},

				addMessage: (message) => {
					set((state) => {
						if (!state.messages[message.channelId]) {
							state.messages[message.channelId] = [];
						}

						const exists = state.messages[message.channelId].find(
							(m) => m.id === message.id
						);
						if (!exists) {
							state.messages[message.channelId].push(message);
							state.messages[message.channelId].sort(
								(a, b) =>
									a.timestamp.getTime() -
									b.timestamp.getTime()
							);
						}

						// Update channel
						const channelIndex = state.channels.findIndex(
							(c) => c.id === message.channelId
						);
						if (channelIndex !== -1) {
							state.channels[channelIndex].lastMessageTime =
								message.timestamp;
							if (
								message.mentions.includes("@you") ||
								message.mentions.includes("@channel")
							) {
								state.channels[channelIndex].unreadCount += 1;
							}
						}
					});
				},

				updateMessage: (messageId, updates) => {
					set((state) => {
						Object.keys(state.messages).forEach((channelId) => {
							const index = state.messages[channelId].findIndex(
								(m) => m.id === messageId
							);
							if (index !== -1) {
								state.messages[channelId][index] = {
									...state.messages[channelId][index],
									...updates,
								};
							}
						});
					});
				},

				removeMessage: (messageId) => {
					set((state) => {
						Object.keys(state.messages).forEach((channelId) => {
							state.messages[channelId] = state.messages[
								channelId
							].filter((m) => m.id !== messageId);
						});
					});
				},

				appendMessages: (channelId, messages) => {
					set((state) => {
						if (!state.messages[channelId]) {
							state.messages[channelId] = [];
						}
						const existingIds = new Set(
							state.messages[channelId].map((m) => m.id)
						);
						const newMessages = messages.filter(
							(m) => !existingIds.has(m.id)
						);
						state.messages[channelId] = [
							...newMessages,
							...state.messages[channelId],
						].sort(
							(a, b) =>
								a.timestamp.getTime() - b.timestamp.getTime()
						);
					});
				},

				setThreads: (threads) => {
					set((state) => {
						state.threads = threads;
					});
				},

				updateThread: (threadId, updates) => {
					set((state) => {
						const index = state.threads.findIndex(
							(t) => t.id === threadId
						);
						if (index !== -1) {
							state.threads[index] = {
								...state.threads[index],
								...updates,
							};
						}
					});
				},

				setStats: (stats) => {
					set((state) => {
						state.stats = stats;
					});
				},

				// UI Actions
				setSelectedChannelId: (channelId) => {
					set((state) => {
						state.selectedChannelId = channelId;
						state.selectedMessageId = null;
					});
				},

				setSelectedMessageId: (messageId) => {
					set((state) => {
						state.selectedMessageId = messageId;
					});
				},

				setFilter: (filter) => {
					set((state) => {
						state.filter = { ...state.filter, ...filter };
					});
				},

				resetFilter: () => {
					set((state) => {
						state.filter = defaultFilter;
					});
				},

				setSearchQuery: (query) => {
					set((state) => {
						state.searchQuery = query;
					});
				},

				setLoading: (loading) => {
					set((state) => {
						state.loading = loading;
					});
				},

				setError: (error) => {
					set((state) => {
						state.error = error;
						state.loading = false;
					});
				},

				// User Interactions
				toggleFavorite: (channelId) => {
					set((state) => {
						const channel = state.channels.find(
							(c) => c.id === channelId
						);
						if (channel) {
							channel.isFavorite = !channel.isFavorite;
						}
					});
				},

				toggleMute: (channelId) => {
					set((state) => {
						const channel = state.channels.find(
							(c) => c.id === channelId
						);
						if (channel) {
							channel.isMuted = !channel.isMuted;
						}
					});
				},

				togglePinMessage: (messageId) => {
					set((state) => {
						Object.keys(state.messages).forEach((channelId) => {
							const message = state.messages[channelId].find(
								(m) => m.id === messageId
							);
							if (message) {
								message.isPinned = !message.isPinned;
							}
						});
					});
				},

				toggleImportantMessage: (messageId) => {
					set((state) => {
						Object.keys(state.messages).forEach((channelId) => {
							const message = state.messages[channelId].find(
								(m) => m.id === messageId
							);
							if (message) {
								message.isImportant = !message.isImportant;
							}
						});
					});
				},

				markChannelAsRead: (channelId) => {
					set((state) => {
						const channel = state.channels.find(
							(c) => c.id === channelId
						);
						if (channel) {
							channel.unreadCount = 0;
						}
					});
				},

				markAllAsRead: () => {
					set((state) => {
						state.channels.forEach((channel) => {
							channel.unreadCount = 0;
						});
					});
				},

				addReaction: (messageId, emoji) => {
					set((state) => {
						Object.keys(state.messages).forEach((channelId) => {
							const message = state.messages[channelId].find(
								(m) => m.id === messageId
							);
							if (message) {
								if (!message.reactions) {
									message.reactions = {};
								}
								message.reactions[emoji] =
									(message.reactions[emoji] || 0) + 1;
							}
						});
					});
				},

				removeReaction: (messageId, emoji) => {
					set((state) => {
						Object.keys(state.messages).forEach((channelId) => {
							const message = state.messages[channelId].find(
								(m) => m.id === messageId
							);
							if (message?.reactions?.[emoji]) {
								message.reactions[emoji] -= 1;
								if (message.reactions[emoji] <= 0) {
									delete message.reactions[emoji];
								}
							}
						});
					});
				},

				// Pagination
				setHasMore: (channelId, hasMore) => {
					set((state) => {
						state.hasMore[channelId] = hasMore;
					});
				},

				setLoadingMore: (channelId, loading) => {
					set((state) => {
						state.loadingMore[channelId] = loading;
					});
				},

				// Utilities
				getChannelById: (channelId) => {
					return get().channels.find((c) => c.id === channelId);
				},

				getMessageById: (messageId) => {
					const messages = get().messages;
					for (const channelMessages of Object.values(messages)) {
						const message = channelMessages.find(
							(m) => m.id === messageId
						);
						if (message) return message;
					}
					return undefined;
				},

				getChannelMessages: (channelId) => {
					return get().messages[channelId] || [];
				},

				getUnreadChannels: () => {
					return get().channels.filter((c) => c.unreadCount > 0);
				},

				getFavoriteChannels: () => {
					return get().channels.filter((c) => c.isFavorite);
				},

				getFilteredChannels: () => {
					const { channels, filter, searchQuery } = get();

					return channels.filter((channel) => {
						// Search filter
						if (
							searchQuery &&
							!channel.name
								.toLowerCase()
								.includes(searchQuery.toLowerCase())
						) {
							return false;
						}

						// Unread filter
						if (
							filter.showUnreadOnly &&
							channel.unreadCount === 0
						) {
							return false;
						}

						// Favorites filter
						if (filter.showFavoritesOnly && !channel.isFavorite) {
							return false;
						}

						// Platform filter
						if (
							filter.platforms.length > 0 &&
							!filter.platforms.includes(channel.platform)
						) {
							return false;
						}

						return true;
					});
				},

				reset: () => {
					set(initialState);
				},
			})),
			{
				name: "communication-store",
				partialize: (state) => ({
					selectedChannelId: state.selectedChannelId,
					filter: state.filter,
				}),
			}
		)
	);
};
