import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { FinanceSubscription, Invoice, Balance, Event } from "@prisma/client";
import { toast } from "sonner";

interface FinanceData {
	subscriptions: FinanceSubscription[];
	invoices: Invoice[];
	balance: Balance | null;
	events: Event[];
	notConnected?: boolean;
}

export interface FinanceState {
	data: FinanceData | null;
	loading: boolean;
	syncLoading: boolean;
	error: string | null;
	mrr: number;
	churnRate: number;
	paymentFailureRate: number;
	activeCustomers: number;
	revenueByPlan: Array<{ name: string; value: number; color: string }>;
	subscriptionStatus: Array<{ name: string; value: number; color: string }>;
	customerActivity: Array<{ month: string; new: number; churned: number }>;
	mrrHistory: Array<{ period: string; value: number }>;
	fetchFinanceData: () => Promise<void>;
	syncFinanceData: () => Promise<void>;
	calculateMetrics: () => void;
}

export const createFinanceStore = () => {
	return create<FinanceState>()(
		persist(
			immer((set, get) => ({
				data: null,
				loading: false,
				syncLoading: false,
				error: null,
				mrr: 0,
				churnRate: 0,
				paymentFailureRate: 0,
				activeCustomers: 0,
				revenueByPlan: [],
				subscriptionStatus: [],
				customerActivity: [],
				mrrHistory: [],
				fetchFinanceData: async () => {
					set((state) => {
						state.loading = true;
						state.error = null;
					});
					try {
						const response = await fetch("/api/finance");
						if (!response.ok)
							throw new Error("Failed to fetch finance data");
						const json: FinanceData = await response.json();
						if (json.notConnected) {
							set((state) => {
								state.data = null;
								state.loading = false;
								state.error = "No Stripe integration";
							});
							return;
						}
						set((state) => {
							state.data = json;
							state.loading = false;
						});
						get().calculateMetrics();
						toast.success("Finance data loaded successfully");
					} catch (error) {
						console.error("Failed to fetch finance data:", error);
						set((state) => {
							state.loading = false;
							state.error = "Failed to load finance data";
						});
						toast.error("Failed to load finance data");
					}
				},
				syncFinanceData: async () => {
					set((state) => {
						state.syncLoading = true;
						state.error = null;
					});
					try {
						const syncResponse = await fetch("/api/finance/sync", {
							method: "POST",
						});
						if (!syncResponse.ok) throw new Error("Sync failed");
						await get().fetchFinanceData();
						set((state) => {
							state.syncLoading = false;
						});
						toast.success("Finance data synced successfully");
					} catch (error) {
						console.error("Failed to sync finance data:", error);
						set((state) => {
							state.syncLoading = false;
							state.error = "Failed to sync finance data";
						});
						toast.error("Failed to sync finance data");
					}
				},
				calculateMetrics: () => {
					const { data } = get();
					if (!data) return;

					// Calculate MRR
					const mrr = data.subscriptions.reduce((sum, sub) => {
						return sub.status === "active"
							? sum +
									(sub.billingCycle === "year"
										? sub.amount / 12
										: sub.amount)
							: sum;
					}, 0);

					// Calculate active customers
					const activeSubs = data.subscriptions.filter(
						(sub) => sub.status === "active"
					);
					const activeCustomers = [
						...new Set(activeSubs.map((sub) => sub.customerId)),
					].length;

					// Calculate churn rate (last 30 days)
					const startOfPeriod = new Date();
					startOfPeriod.setDate(startOfPeriod.getDate() - 30);
					const totalSubsAtStart = data.subscriptions.filter(
						(sub) => new Date(sub.startDate) <= startOfPeriod
					).length;
					const canceledInPeriod = data.subscriptions.filter(
						(sub) =>
							sub.status === "canceled" &&
							sub.endDate &&
							new Date(sub.endDate) >= startOfPeriod
					).length;
					const churnRate =
						totalSubsAtStart > 0
							? (canceledInPeriod / totalSubsAtStart) * 100
							: 0;

					// Calculate payment failure rate (last 30 days)
					const totalInvoices = data.invoices.filter(
						(inv) => new Date(inv.issuedDate) >= startOfPeriod
					).length;
					const failedInvoices = data.invoices.filter(
						(inv) =>
							inv.status === "open" &&
							new Date(inv.issuedDate) >= startOfPeriod
					).length;
					const paymentFailureRate =
						totalInvoices > 0
							? (failedInvoices / totalInvoices) * 100
							: 0;

					// Revenue by plan
					const plans = data.subscriptions.reduce(
						(acc, sub) => {
							if (sub.status === "active") {
								acc[sub.planId] =
									(acc[sub.planId] || 0) +
									(sub.billingCycle === "year"
										? sub.amount / 12
										: sub.amount);
							}
							return acc;
						},
						{} as Record<string, number>
					);
					const colors = [
						"#3b82f6",
						"#8b5cf6",
						"#ec4899",
						"#10b981",
						"#f59e0b",
					];
					const revenueByPlan = Object.entries(plans).map(
						([name, value], index) => ({
							name: name || "Unknown",
							value,
							color: colors[index % colors.length],
						})
					);

					// Subscription status
					const statusCounts = data.subscriptions.reduce(
						(acc, sub) => {
							acc[sub.status] = (acc[sub.status] || 0) + 1;
							return acc;
						},
						{} as Record<string, number>
					);
					const statusColors: Record<string, string> = {
						active: "#10b981",
						trial: "#3b82f6",
						past_due: "#f59e0b",
						canceled: "#ef4444",
						incomplete: "#6b7280",
					};
					const subscriptionStatus = Object.entries(statusCounts).map(
						([name, value]) => ({
							name,
							value,
							color:
								statusColors[name.toLowerCase()] || "#6b7280",
						})
					);

					// Customer activity (last 6 months)
					const months = Array.from({ length: 6 }, (_, i) => {
						const date = new Date();
						date.setMonth(date.getMonth() - i);
						return date.toLocaleString("en-US", { month: "short" });
					}).reverse();
					const customerActivity = months.map((month) => {
						const monthStart = new Date(`${month} 1`);
						const monthEnd = new Date(monthStart);
						monthEnd.setMonth(monthEnd.getMonth() + 1);
						const newCustomers = data.events.filter(
							(ev) =>
								ev.type === "customer.created" &&
								new Date(ev.createdAt) >= monthStart &&
								new Date(ev.createdAt) < monthEnd
						).length;
						const churned = data.events.filter(
							(ev) =>
								ev.type === "customer.subscription.deleted" &&
								new Date(ev.createdAt) >= monthStart &&
								new Date(ev.createdAt) < monthEnd
						).length;
						return { month, new: newCustomers, churned };
					});

					// MRR history (last 6 months)
					const mrrHistory = months.map((month) => {
						const monthStart = new Date(`${month} 1`);
						const monthEnd = new Date(monthStart);
						monthEnd.setMonth(monthEnd.getMonth() + 1);
						const monthlyMrr = data.subscriptions.reduce(
							(sum, sub) => {
								if (
									sub.status === "active" &&
									new Date(sub.startDate) <= monthEnd &&
									(!sub.endDate ||
										new Date(sub.endDate) >= monthStart)
								) {
									return (
										sum +
										(sub.billingCycle === "year"
											? sub.amount / 12
											: sub.amount)
									);
								}
								return sum;
							},
							0
						);
						return { period: month, value: monthlyMrr };
					});

					set((state) => {
						state.mrr = mrr;
						state.churnRate = churnRate;
						state.paymentFailureRate = paymentFailureRate;
						state.activeCustomers = activeCustomers;
						state.revenueByPlan = revenueByPlan;
						state.subscriptionStatus = subscriptionStatus;
						state.customerActivity = customerActivity;
						state.mrrHistory = mrrHistory;
					});
				},
			})),
			{ name: "finance-store" }
		)
	);
};
