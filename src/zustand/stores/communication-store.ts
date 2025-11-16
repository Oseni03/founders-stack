// stores/messages-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Message } from "@prisma/client";

export interface CommunicationState {
	messages: Message[];
	channels: Array<{
		id: string;
		name: string;
		type: string;
		unreadCount: number;
	}>;
	selectedChannel: string | null;
	setMessages: (messages: Message[]) => void;
	setChannels: (
		channels: Array<{
			id: string;
			name: string;
			type: string;
			unreadCount: number;
		}>
	) => void;
	setSelectedChannel: (channel: string | null) => void;
	filters: { search: string; unreadOnly: boolean; platform: string };
	setFilters: (filters: Partial<CommunicationState["filters"]>) => void;
}

export const createCommunicationStore = () => {
	return create<CommunicationState>()(
		persist(
			immer((set) => ({
				messages: [],
				channels: [],
				selectedChannel: null,
				filters: { search: "", unreadOnly: false, platform: "" },
				setMessages: (messages) => set({ messages }),
				setChannels: (channels) => set({ channels }),
				setSelectedChannel: (selectedChannel) =>
					set({ selectedChannel }),
				setFilters: (newFilters) =>
					set((state) => ({
						filters: { ...state.filters, ...newFilters },
					})),
			})),
			{ name: "messages-store" }
		)
	);
};
