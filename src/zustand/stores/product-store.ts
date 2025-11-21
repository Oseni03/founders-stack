// stores/apex-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";

// ============================================
// TYPES (mirrors your context exactly)
// ============================================

export interface LinkedEvidence {
	type: "linear" | "intercom" | "zendesk" | "github";
	id: string;
	title: string;
}

export interface CustomerPain {
	theme: string;
	tickets: number;
	mrr: string;
	quote: string;
	score: number;
	linked: LinkedEvidence[];
}

export interface Blocker {
	team: string;
	description: string;
	affectedIssues?: string[];
	affectedPRs?: string[];
}

export interface SprintHealth {
	completed: number;
	total: number;
	daysRemaining: number;
	velocity: number;
	baseline: number;
	delta: number;
	blockers: Blocker[];
	velocityData: { name: string; velocity: number }[];
}

export interface BacklogItem {
	id: string;
	title: string;
	pain: number;
	effort: string;
	revenue: string;
	tag: "High" | "Feat" | "UX" | "Maint";
	rank?: number;
	previousRank?: number;
}

export interface ShippedFeature {
	title: string;
	pain: string;
	pr: string;
	adoption: string;
	image: string;
}

export interface Snapshot {
	date: string;
	velocity: number;
	blockers: number;
	topPain: string;
	summary: string;
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	sources?: LinkedEvidence[];
	timestamp: number;
}

// ============================================
// STORE DEFINITION
// ============================================

export interface ProductStore {
	// Data
	topPains: CustomerPain[];
	sprintHealth: SprintHealth;
	backlog: BacklogItem[];
	shipped: ShippedFeature[];
	snapshots: Record<string, Snapshot>;
	chatMessages: ChatMessage[];
	currentSessionId: string;

	// UI / Loading
	isLoading: boolean;
	isRefreshing: boolean;
	lastSyncTime: number;

	// Integration status
	integrations: {
		linear: boolean;
		github: boolean;
		intercom: boolean;
	};

	// Actions
	refreshDashboard: () => Promise<void>;
	reorderBacklog: (items: BacklogItem[]) => void;
	pushToLinear: () => Promise<void>;
	generateDiagnosis: () => Promise<string>;
	sendChatMessage: (message: string) => Promise<void>;
	createPrioritizationPlan: (painTheme: string) => Promise<void>;
	setIsLoading: (loading: boolean) => void;
}

// ============================================
// MOCK DATA (same as before, but in store)
// ============================================

const mockPains: CustomerPain[] = [
	{
		theme: "Mobile Checkout Timeout",
		tickets: 14,
		mrr: "$12,400",
		quote: "I've tried to pay 3 times and it spins forever...",
		score: 9.2,
		linked: [
			{
				type: "linear",
				id: "LIN-392",
				title: "Investigate Stripe webhook latency",
			},
			{
				type: "linear",
				id: "LIN-401",
				title: "Mobile safari timeout fix",
			},
			{
				type: "intercom",
				id: "INT-8821",
				title: "User report: iPhone 14 Pro",
			},
			{
				type: "intercom",
				id: "INT-8824",
				title: "User report: Checkout spinner",
			},
		],
	},
	{
		theme: "CSV Import Errors",
		tickets: 8,
		mrr: "$8,200",
		quote: "Importing my contacts fails with generic error 500",
		score: 7.8,
		linked: [
			{ type: "linear", id: "LIN-355", title: "CSV Parser memory leak" },
			{
				type: "zendesk",
				id: "ZEN-102",
				title: "Import failed for Enterprise user",
			},
		],
	},
	{
		theme: "Dark Mode Contrast",
		tickets: 22,
		mrr: "$2,100",
		quote: "Can't read the sidebar links in dark mode",
		score: 6.5,
		linked: [
			{
				type: "linear",
				id: "LIN-410",
				title: "Update sidebar color tokens",
			},
		],
	},
	{
		theme: "Notification Spam",
		tickets: 18,
		mrr: "$5,400",
		quote: "Please stop emailing me every time a task moves",
		score: 6.1,
		linked: [
			{
				type: "linear",
				id: "LIN-330",
				title: "Batch email notifications",
			},
			{
				type: "intercom",
				id: "INT-8700",
				title: "Too many emails complaint",
			},
		],
	},
	{
		theme: "API Rate Limits",
		tickets: 4,
		mrr: "$45,000",
		quote: "We're hitting limits but dashboard says we're fine",
		score: 8.9,
		linked: [
			{
				type: "linear",
				id: "LIN-450",
				title: "Redis rate limiter sync issue",
			},
			{ type: "github", id: "PR-882", title: "Fix/rate-limit-headers" },
		],
	},
];

const mockSprintHealth: SprintHealth = {
	completed: 24,
	total: 32,
	daysRemaining: 4,
	velocity: 24,
	baseline: 29,
	delta: -17,
	blockers: [
		{
			team: "Backend Team",
			description: "3 PRs waiting on API spec review (5+ days)",
			affectedIssues: ["LIN-234", "LIN-235"],
			affectedPRs: ["#892", "#895"],
		},
		{
			team: "Design System",
			description: "12 issues blocked on component library",
			affectedIssues: ["LIN-305", "LIN-310"],
		},
	],
	velocityData: [
		{ name: "Mon", velocity: 12 },
		{ name: "Tue", velocity: 18 },
		{ name: "Wed", velocity: 15 },
		{ name: "Thu", velocity: 25 },
		{ name: "Fri", velocity: 20 },
		{ name: "Sat", velocity: 8 },
		{ name: "Sun", velocity: 5 },
	],
};

const mockBacklog: BacklogItem[] = [
	{
		id: "1",
		title: "Fix checkout race condition",
		pain: 9.8,
		effort: "2d",
		revenue: "$45k",
		tag: "High",
		rank: 1,
	},
	{
		id: "2",
		title: "Add SSO for Enterprise",
		pain: 8.5,
		effort: "5d",
		revenue: "$120k",
		tag: "Feat",
		rank: 2,
		previousRank: 3,
	},
	{
		id: "3",
		title: "Mobile navigation refactor",
		pain: 7.2,
		effort: "3d",
		revenue: "$12k",
		tag: "UX",
		rank: 3,
		previousRank: 5,
	},
	{
		id: "4",
		title: "Update dependencies",
		pain: 2.1,
		effort: "1d",
		revenue: "$0",
		tag: "Maint",
		rank: 4,
		previousRank: 2,
	},
	{
		id: "5",
		title: "Export reports to PDF",
		pain: 6.5,
		effort: "4d",
		revenue: "$8k",
		tag: "Feat",
		rank: 5,
		previousRank: 8,
	},
];

const mockShipped: ShippedFeature[] = [
	{
		title: "One-Click Linear Sync",
		pain: "Manual backlog syncing",
		pr: "#492",
		adoption: "45% of users",
		image: "linear-sync",
	},
	{
		title: "Dark Mode V2",
		pain: "Contrast issues",
		pr: "#488",
		adoption: "89% of users",
		image: "dark-mode",
	},
	{
		title: "API Analytics",
		pain: "Blind to rate limits",
		pr: "#475",
		adoption: "12% of users",
		image: "analytics",
	},
	{
		title: "Team Permissions",
		pain: "Security concerns",
		pr: "#450",
		adoption: "60% of users",
		image: "permissions",
	},
	{
		title: "SSO Integration",
		pain: "Enterprise Login",
		pr: "#442",
		adoption: "5% of users",
		image: "sso-login",
	},
];

const mockSnapshots: Record<string, Snapshot> = {
	"2025-11-20": {
		velocity: 24,
		blockers: 3,
		topPain: "Mobile Checkout Timeout",
		summary:
			"Velocity dropped 18% due to critical checkout bug. Backend team blocked on API specs.",
		date: "2025-11-20",
	},
	"2025-11-19": {
		velocity: 26,
		blockers: 2,
		topPain: "Mobile Checkout Timeout",
		summary:
			"Initial reports of checkout timeout. Frontend investigation started.",
		date: "2025-11-19",
	},
	"2025-11-18": {
		velocity: 28,
		blockers: 2,
		topPain: "Mobile Checkout Timeout",
		summary:
			"Steady progress. Design team finalized checkout flow updates.",
		date: "2025-11-18",
	},
	"2025-11-15": {
		velocity: 32,
		blockers: 0,
		topPain: "CSV Import Errors",
		summary: "High velocity day. Team cleared the CSV import backlog.",
		date: "2025-11-15",
	},
	"2025-11-14": {
		velocity: 30,
		blockers: 1,
		topPain: "CSV Import Errors",
		summary: "CSV parser fix deployed to staging. Testing in progress.",
		date: "2025-11-14",
	},
	"2025-11-10": {
		velocity: 15,
		blockers: 5,
		topPain: "API Rate Limits",
		summary:
			"Multiple teams blocked by external API rate limits. Escalated to vendor.",
		date: "2025-11-10",
	},
	"2025-11-05": {
		velocity: 22,
		blockers: 1,
		topPain: "Dark Mode Contrast",
		summary:
			"Design system update rollout caused minor regressions in dark mode.",
		date: "2025-11-05",
	},
	"2025-10-28": {
		velocity: 35,
		blockers: 0,
		topPain: "Notification Spam",
		summary: "Record velocity. Notification batching feature shipped.",
		date: "2025-10-28",
	},
};

export const createProductStore = () =>
	create<ProductStore>()(
		persist(
			immer((set, get) => ({
				topPains: mockPains,
				sprintHealth: mockSprintHealth,
				backlog: mockBacklog,
				shipped: mockShipped,
				snapshots: mockSnapshots,
				chatMessages: [],
				currentSessionId: `session-${Date.now()}`,
				isLoading: false,
				isRefreshing: false,
				lastSyncTime: Date.now(),
				integrations: { linear: true, github: true, intercom: true },

				setIsLoading: (loading) => set({ isLoading: loading }),

				refreshDashboard: async () => {
					set({ isRefreshing: true });
					await new Promise((r) => setTimeout(r, 1500));
					set({
						topPains: mockPains,
						sprintHealth: produce(mockSprintHealth, (draft) => {
							draft.completed = Math.min(
								draft.total,
								draft.completed + Math.floor(Math.random() * 3)
							);
						}),
						backlog: mockBacklog,
						lastSyncTime: Date.now(),
						isRefreshing: false,
					});
				},

				reorderBacklog: (items) =>
					set({
						backlog: items.map((item, i) => ({
							...item,
							previousRank: item.rank,
							rank: i + 1,
						})),
					}),

				pushToLinear: async () => {
					set({ isLoading: true });
					await new Promise((r) => setTimeout(r, 2000));
					console.log(
						"Backlog pushed to Linear – Apex Priority View created"
					);
					set({ isLoading: false });
				},

				generateDiagnosis: async () => {
					set({ isLoading: true });
					await new Promise((r) => setTimeout(r, 3000));

					const diagnosis = `Sprint velocity down 18% (24 → 29 baseline)

**Root Causes:**
• Backend: 3 PRs blocked on API spec (#892, #895) → blocking LIN-234
• Design System: 12 issues blocked on component library
• External: Stripe webhook timeouts on mobile

**Actions:**
• Assign API spec reviewer (24h SLA)
• Fast-track component library PRs
• Escalate Stripe issue`;

					set({ isLoading: false });
					return diagnosis;
				},

				sendChatMessage: async (message) => {
					const userMsg: ChatMessage = {
						id: `msg-${Date.now()}`,
						role: "user",
						content: message,
						timestamp: Date.now(),
					};

					set((state) => ({
						chatMessages: [...state.chatMessages, userMsg],
					}));

					await new Promise((r) => setTimeout(r, 1800));

					let response = "";
					let sources: LinkedEvidence[] = [];

					if (
						message.toLowerCase().includes("stuck") ||
						message.includes("234")
					) {
						response = `LIN-234 blocked 5 days → waiting on #892 (API spec)`;
						sources = [
							{
								type: "linear",
								id: "LIN-234",
								title: "User Auth Refactor",
							},
							{
								type: "github",
								id: "PR-892",
								title: "OpenAPI Spec Update",
							},
						];
					} else if (message.toLowerCase().includes("checkout")) {
						response = `3 critical checkout bugs → $24k MRR at risk`;
						sources = [
							{
								type: "linear",
								id: "LIN-392",
								title: "Mobile Stripe timeout",
							},
							{
								type: "linear",
								id: "LIN-401",
								title: "Cart persistence",
							},
						];
					} else {
						response = `Ask me anything. I see Linear, GitHub, Intercom, and your velocity.`;
					}

					set((state) => ({
						chatMessages: [
							...state.chatMessages,
							{
								id: `msg-${Date.now() + 1}`,
								role: "assistant",
								content: response,
								sources,
								timestamp: Date.now(),
							},
						],
					}));
				},

				createPrioritizationPlan: async (painTheme) => {
					set({ isLoading: true });
					await new Promise((r) => setTimeout(r, 2000));

					const pain = get().topPains.find(
						(p) => p.theme === painTheme
					);
					if (pain) {
						const relatedIds = pain.linked
							.filter((l) => l.type === "linear")
							.map((l) => l.id.replace("LIN-", ""));

						set({
							backlog: produce(get().backlog, (draft) => {
								draft.sort((a, b) => {
									const aRelated = relatedIds.includes(a.id);
									const bRelated = relatedIds.includes(b.id);
									return aRelated && !bRelated
										? -1
										: !aRelated && bRelated
											? 1
											: 0;
								});
								draft.forEach((item, i) => {
									item.previousRank = item.rank;
									item.rank = i + 1;
								});
							}),
						});
					}

					set({ isLoading: false });
				},
			})),
			{
				name: "apex-store-v1",
				partialize: (state) => ({
					backlog: state.backlog,
					chatMessages: state.chatMessages,
				}),
			}
		)
	);
