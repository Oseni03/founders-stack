import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
	Comment as BaseComment,
	DesignFile as BaseDesignFile,
	LinkedItem,
	Project,
	User,
} from "@prisma/client";

interface Comment extends BaseComment {
	author: User;
}

export interface DesignFile extends BaseDesignFile {
	project: Project;
	comments: Comment[];
	linkedItems: LinkedItem[];
}

export interface DesignState {
	designs: DesignFile[];
	selectedDesign: DesignFile | null;
	filters: {
		project: string;
		status: string;
		lastUpdated: string;
		fileType: string;
	};
	setDesigns: (designs: DesignFile[]) => void;
	setSelectedDesign: (design: DesignFile | null) => void;
	setFilters: (filters: Partial<DesignState["filters"]>) => void;
}

export const createDesignStore = () => {
	return create<DesignState>()(
		persist(
			immer((set) => ({
				designs: [],
				selectedDesign: null,
				filters: {
					project: "",
					status: "",
					lastUpdated: "",
					fileType: "",
				},
				setDesigns: (designs) => set({ designs }),
				setSelectedDesign: (selectedDesign) => set({ selectedDesign }),
				setFilters: (newFilters) =>
					set((state) => ({
						filters: { ...state.filters, ...newFilters },
					})),
			})),
			{ name: "design-store" }
		)
	);
};
