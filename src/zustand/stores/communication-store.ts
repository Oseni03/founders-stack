import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface Channel {
	id: string;
	name: string;
	description: string;
}

interface Message {
	id: string;
	text: string;
	user: string;
	channelId: string;
	timestamp: Date;
}

interface MessageVolumeTrend {
	name: string;
	messages: number;
	mentions: number;
}

interface CommunicationData {
	channels: Channel[];
	messagesByChannel: Record<string, Message[]>;
	messageVolume: number;
	unreadMentions: number;
	sentiment: number;
	recentThreads: Array<{
		id: string;
		channel: string;
		preview: string;
		mentions: number;
	}>;
	insight: string;
	messageVolumeTrendData: MessageVolumeTrend[];
}

export interface CommunicationState {
	data: CommunicationData | null;
	loading: boolean;
	selectedChannelId: string | null;
	showAllMessages: boolean;
	error: string | null;

	setData: (data: CommunicationData) => void;
	setLoading: (loading: boolean) => void;
	setSelectedChannelId: (channelId: string | null) => void;
	setShowAllMessages: (show: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;

	addChannel: (channel: Channel) => void;
	removeChannel: (channelId: string) => void;
	updateChannel: (channelId: string, updates: Partial<Channel>) => void;

	addMessage: (message: Message) => void;
	removeMessage: (messageId: string) => void;

	reset: () => void;
}

const initialCommunicationState = {
	data: null,
	loading: true,
	selectedChannelId: null,
	showAllMessages: true,
	error: null,
};

export const createCommunicationStore = () => {
	return create<CommunicationState>()(
		persist(
			immer((set) => ({
				...initialCommunicationState,

				setData: (data) => {
					set((state) => {
						state.data = data;
						state.loading = false;
						state.error = null;

						// Auto-select first channel if none selected
						if (
							!state.selectedChannelId &&
							data.channels.length > 0
						) {
							state.selectedChannelId = data.channels[0].id;
						}
					});
				},

				setLoading: (loading) => {
					set((state) => {
						state.loading = loading;
					});
				},

				setSelectedChannelId: (channelId) => {
					set((state) => {
						state.selectedChannelId = channelId;
					});
				},

				setShowAllMessages: (show) => {
					set((state) => {
						state.showAllMessages = show;
					});
				},

				setError: (error) => {
					set((state) => {
						state.error = error;
					});
				},

				clearError: () => {
					set((state) => {
						state.error = null;
					});
				},

				addChannel: (channel) => {
					set((state) => {
						if (state.data) {
							state.data.channels.push(channel);
							state.data.messagesByChannel[channel.id] = [];

							// Auto-select if first channel
							if (state.data.channels.length === 1) {
								state.selectedChannelId = channel.id;
							}
						}
					});
				},

				removeChannel: (channelId) => {
					set((state) => {
						if (state.data) {
							state.data.channels = state.data.channels.filter(
								(c) => c.id !== channelId
							);
							delete state.data.messagesByChannel[channelId];

							// Update selected channel if deleted
							if (state.selectedChannelId === channelId) {
								state.selectedChannelId =
									state.data.channels.length > 0
										? state.data.channels[0].id
										: null;
							}
						}
					});
				},

				updateChannel: (channelId, updates) => {
					set((state) => {
						if (state.data) {
							const channelIndex = state.data.channels.findIndex(
								(c) => c.id === channelId
							);
							if (channelIndex !== -1) {
								state.data.channels[channelIndex] = {
									...state.data.channels[channelIndex],
									...updates,
								};
							}
						}
					});
				},

				addMessage: (message) => {
					set((state) => {
						if (state.data) {
							if (
								!state.data.messagesByChannel[message.channelId]
							) {
								state.data.messagesByChannel[
									message.channelId
								] = [];
							}
							state.data.messagesByChannel[
								message.channelId
							].unshift(message);
							state.data.messageVolume += 1;
						}
					});
				},

				removeMessage: (messageId) => {
					set((state) => {
						if (state.data) {
							Object.keys(state.data.messagesByChannel).forEach(
								(channelId) => {
									state.data!.messagesByChannel[channelId] =
										state.data!.messagesByChannel[
											channelId
										].filter((m) => m.id !== messageId);
								}
							);
						}
					});
				},

				reset: () => {
					set(initialCommunicationState);
				},
			})),
			{
				name: "communication-store",
				partialize: (state) => ({
					selectedChannelId: state.selectedChannelId,
					showAllMessages: state.showAllMessages,
				}),
			}
		)
	);
};
