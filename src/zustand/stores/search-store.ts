import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface SearchState {
	recentSearches: string[];
	addQuery: (query: string) => void;
}

export const createSearchStore = () => {
	return create<SearchState>()(
		persist(
			immer((set) => ({
				recentSearches: [],
				addQuery: (query) => {
					set((state) => {
						state.recentSearches = [...state.recentSearches, query];
					});
				},
			})),
			{ name: "search-store" }
		)
	);
};
