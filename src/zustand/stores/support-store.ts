import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { SupportTicket } from "@prisma/client";

export interface SupportState {
	tickets: SupportTicket[];
	setTickets: (tickets: SupportTicket[]) => void;
	selectedTicket: SupportTicket | null;
	setSelectedTicket: (ticket: SupportTicket | null) => void;
	filters: {
		status: string;
		priority: string;
		// Add more
	};
	setFilters: (filters: Partial<SupportState["filters"]>) => void;
}

export const createSupportStore = () => {
	return create<SupportState>()(
		persist(
			immer((set) => ({
				tickets: [],
				selectedTicket: null,
				filters: { status: "", priority: "" },
				setTickets: (tickets) => set({ tickets }),
				setSelectedTicket: (selectedTicket) => set({ selectedTicket }),
				setFilters: (newFilters) =>
					set((state) => ({
						filters: { ...state.filters, ...newFilters },
					})),
			})),
			{
				name: "support-store",
			}
		)
	);
};
