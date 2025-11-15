/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useMessages.ts
import { useEffect, useCallback } from "react";
import { useCommunicationStore } from "@/zustand/providers/communication-store-provider";

export const useChannels = () => {
	const {
		channels,
		loading,
		error,
		setChannels,
		setLoading,
		setError,
		addChannel,
		updateChannel,
		removeChannel,
		toggleFavorite,
		toggleMute,
		markChannelAsRead,
	} = useCommunicationStore((state) => state);

	const fetchChannels = useCallback(
		async (options?: { platform?: string; includeArchived?: boolean }) => {
			try {
				setLoading(true);
				const params = new URLSearchParams();
				if (options?.platform)
					params.append("platform", options.platform);
				if (options?.includeArchived)
					params.append("includeArchived", "true");

				const response = await fetch(
					`/api/messages/channels?${params}`
				);
				if (!response.ok) throw new Error("Failed to fetch channels");

				const data = await response.json();
				setChannels(data.channels);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			}
		},
		[setChannels, setLoading, setError]
	);

	const createChannel = useCallback(
		async (channelData: {
			name: string;
			description?: string;
			type: string;
			isPrivate: boolean;
			platform: string;
			externalId: string;
			integrationId: string;
		}) => {
			try {
				const response = await fetch("/api/messages/channels", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(channelData),
				});

				if (!response.ok) throw new Error("Failed to create channel");

				const data = await response.json();
				addChannel(data.channel);
				return data.channel;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				throw err;
			}
		},
		[addChannel, setError]
	);

	const updateChannelData = useCallback(
		async (
			channelId: string,
			updates: Partial<{
				name: string;
				description: string;
				status: string;
				attributes: any;
			}>
		) => {
			try {
				const response = await fetch(
					`/api/messages/channels/${channelId}`,
					{
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(updates),
					}
				);

				if (!response.ok) throw new Error("Failed to update channel");

				const data = await response.json();
				updateChannel(channelId, data.channel);
				return data.channel;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				throw err;
			}
		},
		[updateChannel, setError]
	);

	const deleteChannel = useCallback(
		async (channelId: string) => {
			try {
				const response = await fetch(
					`/api/messages/channels/${channelId}`,
					{
						method: "DELETE",
					}
				);

				if (!response.ok) throw new Error("Failed to delete channel");

				removeChannel(channelId);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				throw err;
			}
		},
		[removeChannel, setError]
	);

	return {
		channels,
		loading,
		error,
		fetchChannels,
		createChannel,
		updateChannel: updateChannelData,
		deleteChannel,
		toggleFavorite,
		toggleMute,
		markChannelAsRead,
	};
};

export const useMessages = (channelId?: string | null) => {
	const {
		messages,
		loading,
		error,
		hasMore,
		loadingMore,
		setMessages,
		appendMessages,
		addMessage,
		updateMessage,
		removeMessage,
		setLoading,
		setError,
		setHasMore,
		setLoadingMore,
		togglePinMessage,
		toggleImportantMessage,
		addReaction,
		removeReaction,
	} = useCommunicationStore((state) => state);

	const channelMessages = channelId ? messages[channelId] || [] : [];
	const hasMoreMessages = channelId ? hasMore[channelId] || false : false;
	const isLoadingMore = channelId ? loadingMore[channelId] || false : false;

	const fetchMessages = useCallback(
		async (options?: {
			channelId?: string;
			limit?: number;
			includeThreads?: boolean;
			onlyMentions?: boolean;
			search?: string;
		}) => {
			try {
				setLoading(true);
				const params = new URLSearchParams();
				if (options?.channelId)
					params.append("channelId", options.channelId);
				if (options?.limit)
					params.append("limit", options.limit.toString());
				if (options?.includeThreads)
					params.append("includeThreads", "true");
				if (options?.onlyMentions)
					params.append("onlyMentions", "true");
				if (options?.search) params.append("search", options.search);

				const response = await fetch(`/api/messages?${params}`);
				if (!response.ok) throw new Error("Failed to fetch messages");

				const data = await response.json();

				if (options?.channelId) {
					setMessages(options.channelId, data.messages);
					setHasMore(options.channelId, data.hasMore);
				}

				return data;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[setMessages, setLoading, setError, setHasMore]
	);

	const loadMoreMessages = useCallback(
		async (cursor: string) => {
			if (!channelId || isLoadingMore) return;

			try {
				setLoadingMore(channelId, true);
				const params = new URLSearchParams({
					channelId,
					cursor,
					limit: "50",
				});

				const response = await fetch(`/api/messages?${params}`);
				if (!response.ok)
					throw new Error("Failed to load more messages");

				const data = await response.json();
				appendMessages(channelId, data.messages);
				setHasMore(channelId, data.hasMore);

				return data;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				throw err;
			} finally {
				setLoadingMore(channelId, false);
			}
		},
		[
			channelId,
			isLoadingMore,
			appendMessages,
			setLoadingMore,
			setHasMore,
			setError,
		]
	);

	const sendMessage = useCallback(
		async (messageData: {
			channelId: string;
			content: string;
			mentions?: string[];
			attachments?: any;
			parentMessageId?: string;
			threadId?: string;
		}) => {
			try {
				const response = await fetch("/api/messages", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(messageData),
				});

				if (!response.ok) throw new Error("Failed to send message");

				const data = await response.json();
				addMessage(data.message);
				return data.message;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				throw err;
			}
		},
		[addMessage, setError]
	);

	const editMessage = useCallback(
		async (
			messageId: string,
			updates: {
				content?: string;
				isPinned?: boolean;
				isImportant?: boolean;
			}
		) => {
			try {
				const response = await fetch(`/api/messages/${messageId}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(updates),
				});

				if (!response.ok) throw new Error("Failed to update message");

				const data = await response.json();
				updateMessage(messageId, data.message);
				return data.message;
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				throw err;
			}
		},
		[updateMessage, setError]
	);

	const addMessageReaction = useCallback(
		async (messageId: string, emoji: string) => {
			try {
				addReaction(messageId, emoji); // Optimistic update

				const response = await fetch(
					`/api/messages/${messageId}/reactions`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ emoji }),
					}
				);

				if (!response.ok) {
					removeReaction(messageId, emoji); // Rollback on error
					throw new Error("Failed to add reaction");
				}

				const data = await response.json();
				updateMessage(messageId, { reactions: data.message.reactions });
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				throw err;
			}
		},
		[addReaction, removeReaction, updateMessage, setError]
	);

	const removeMessageReaction = useCallback(
		async (messageId: string, emoji: string) => {
			try {
				removeReaction(messageId, emoji); // Optimistic update

				const response = await fetch(
					`/api/messages/${messageId}/reactions?emoji=${emoji}`,
					{
						method: "DELETE",
					}
				);

				if (!response.ok) {
					addReaction(messageId, emoji); // Rollback on error
					throw new Error("Failed to remove reaction");
				}

				const data = await response.json();
				updateMessage(messageId, { reactions: data.message.reactions });
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				throw err;
			}
		},
		[removeReaction, addReaction, updateMessage, setError]
	);

	// Auto-fetch messages when channelId changes
	useEffect(() => {
		if (channelId) {
			fetchMessages({ channelId });
		}
	}, [channelId, fetchMessages]);

	return {
		messages: channelMessages,
		loading,
		error,
		hasMore: hasMoreMessages,
		loadingMore: isLoadingMore,
		fetchMessages,
		loadMoreMessages,
		sendMessage,
		editMessage,
		togglePinMessage,
		toggleImportantMessage,
		addReaction: addMessageReaction,
		removeReaction: removeMessageReaction,
	};
};

export const useThreads = () => {
	const {
		threads,
		loading,
		error,
		setThreads,
		updateThread,
		setLoading,
		setError,
	} = useCommunicationStore((state) => state);

	const fetchThreads = useCallback(
		async (options?: { channelId?: string; activeOnly?: boolean }) => {
			try {
				setLoading(true);
				const params = new URLSearchParams();
				if (options?.channelId)
					params.append("channelId", options.channelId);
				if (options?.activeOnly) params.append("activeOnly", "true");

				const response = await fetch(`/api/messages/threads?${params}`);
				if (!response.ok) throw new Error("Failed to fetch threads");

				const data = await response.json();
				setThreads(data.threads);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		},
		[setThreads, setLoading, setError]
	);

	return {
		threads,
		loading,
		error,
		fetchThreads,
		updateThread,
	};
};

export const useMessageStats = () => {
	const { stats, loading, error, setStats, setLoading, setError } =
		useCommunicationStore((state) => state);

	const fetchStats = useCallback(
		async (days: number = 30) => {
			try {
				setLoading(true);
				const response = await fetch(
					`/api/messages/stats?days=${days}`
				);
				if (!response.ok) throw new Error("Failed to fetch stats");

				const data = await response.json();
				setStats(data.stats);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setLoading(false);
			}
		},
		[setStats, setLoading, setError]
	);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	return {
		stats,
		loading,
		error,
		fetchStats,
	};
};

// Combined hook for the Messages page
export const useMessagesPage = () => {
	const channelsHook = useChannels();
	const { selectedChannelId, setSelectedChannelId } = useCommunicationStore(
		(state) => state
	);
	const messagesHook = useMessages(selectedChannelId);
	const threadsHook = useThreads();
	const statsHook = useMessageStats();

	// Initialize data on mount
	useEffect(() => {
		channelsHook.fetchChannels();
		threadsHook.fetchThreads();
	}, []);

	return {
		...channelsHook,
		...messagesHook,
		...threadsHook,
		...statsHook,
		selectedChannelId,
		setSelectedChannelId,
	};
};
