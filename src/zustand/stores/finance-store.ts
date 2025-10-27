// stores/finance-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface Transaction {
	id: string;
	type: string;
	amount: number;
	status: string;
	date: string;
}

interface FinanceData {
	mrr: number;
	churn: number;
	activeSubscriptions: number;
	recentTransactions: Transaction[];
	insight: string;
	balance: {
		available: number;
		pending: number;
		currency: string;
	};
	balanceBreakdown: Array<{
		sourceTool: string;
		currency: string;
		available: number;
		pending: number;
		updatedAt: Date | string;
	}>;
	subscriptionBreakdown: Array<{
		planId: string;
		count: number;
		revenue: number;
	}>;
	invoiceStats: {
		total: number;
		paid: number;
		pending: number;
		overdue: number;
	};
}

export interface FinanceState {
	data: FinanceData | null;
	loading: boolean;
	timeRange: string;

	// Actions
	setData: (data: FinanceData) => void;
	setLoading: (loading: boolean) => void;
	setTimeRange: (range: string) => void;

	updateMRR: (mrr: number) => void;
	updateChurn: (churn: number) => void;
	updateBalance: (balance: FinanceData["balance"]) => void;
	addTransaction: (transaction: Transaction) => void;

	reset: () => void;
}

const initialState = {
	data: null,
	loading: true,
	timeRange: "30d",
};

export const createFinanceStore = () => {
	return create<FinanceState>()(
		persist(
			immer((set) => ({
				...initialState,

				setData: (data) => {
					set((state) => {
						state.data = data;
						state.loading = false;
					});
				},

				setLoading: (loading) => {
					set((state) => {
						state.loading = loading;
					});
				},

				setTimeRange: (range) => {
					set((state) => {
						state.timeRange = range;
					});
				},

				updateMRR: (mrr) => {
					set((state) => {
						if (state.data) {
							state.data.mrr = mrr;
						}
					});
				},

				updateChurn: (churn) => {
					set((state) => {
						if (state.data) {
							state.data.churn = churn;
						}
					});
				},

				updateBalance: (balance) => {
					set((state) => {
						if (state.data) {
							state.data.balance = balance;
						}
					});
				},

				addTransaction: (transaction) => {
					set((state) => {
						if (state.data) {
							state.data.recentTransactions.unshift(transaction);
							// Keep only the 10 most recent
							state.data.recentTransactions =
								state.data.recentTransactions.slice(0, 10);
						}
					});
				},

				reset: () => {
					set(initialState);
				},
			})),
			{
				name: "finance-store",
				partialize: (state) => ({
					timeRange: state.timeRange,
				}),
			}
		)
	);
};
