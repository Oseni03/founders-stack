import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type {
	Task,
	Message,
	PullRequest,
	SupportTicket,
	User,
} from "@prisma/client";

export interface DashboardState {
	actionItems: {
		tasks: Task[];
		pullRequests: PullRequest[];
		messages: Message[];
		supportTickets: SupportTicket[];
	};
	notifications: Array<{
		id: string;
		type: string;
		content: string;
		source: string;
		timestamp: string;
	}>;
	metrics: Array<{
		name: string;
		value: number;
		unit: string;
		trend: number;
		health: "good" | "warning" | "critical";
	}>;
	sprintStatus: {
		progress: number;
		tasks: { done: number; inProgress: number; toDo: number };
		blockers: Task[];
	};
	recentActivity: Array<{
		id: string;
		user: User;
		action: string;
		item: string;
		timestamp: string;
	}>;
	teamPulse: Array<{
		user: string;
		status: "online" | "away" | "offline";
		currentTask: string;
	}>;
	setActionItems: (items: Partial<DashboardState["actionItems"]>) => void;
	setNotifications: (notifications: DashboardState["notifications"]) => void;
	setMetrics: (metrics: DashboardState["metrics"]) => void;
	setSprintStatus: (status: Partial<DashboardState["sprintStatus"]>) => void;
	setRecentActivity: (activity: DashboardState["recentActivity"]) => void;
	setTeamPulse: (pulse: DashboardState["teamPulse"]) => void;
}

export const createDashboardStore = () => {
	return create<DashboardState>()(
		persist(
			immer((set) => ({
				actionItems: {
					tasks: [],
					pullRequests: [],
					messages: [],
					supportTickets: [],
				},
				notifications: [],
				metrics: [],
				sprintStatus: {
					progress: 0,
					tasks: { done: 0, inProgress: 0, toDo: 0 },
					blockers: [],
				},
				recentActivity: [],
				teamPulse: [],
				setActionItems: (items) =>
					set((state) => ({
						actionItems: { ...state.actionItems, ...items },
					})),
				setNotifications: (notifications) => set({ notifications }),
				setMetrics: (metrics) => set({ metrics }),
				setSprintStatus: (status) =>
					set((state) => ({
						sprintStatus: { ...state.sprintStatus, ...status },
					})),
				setRecentActivity: (activity) =>
					set({ recentActivity: activity }),
				setTeamPulse: (pulse) => set({ teamPulse: pulse }),
			})),
			{ name: "dashboard-store" }
		)
	);
};
