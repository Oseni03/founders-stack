import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
	generateFinancialInsight,
	updateBalance,
} from "@/server/categories/finance";
import { withAuth } from "@/lib/middleware";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			const searchParams = request.nextUrl.searchParams;
			const range = searchParams.get("range") || "30d";
			const organizationId = user.organizationId;

			// Calculate date range
			const days = parseInt(range.replace("d", ""));
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - days);

			// Fetch all balances from all source tools
			const balances = await prisma.balance.findMany({
				where: { organizationId },
			});

			// Aggregate balances by currency
			const balanceMap = new Map<
				string,
				{ available: number; pending: number }
			>();

			balances.forEach((bal) => {
				const existing = balanceMap.get(bal.currency) || {
					available: 0,
					pending: 0,
				};
				existing.available += bal.availableAmount;
				existing.pending += bal.pendingAmount;
				balanceMap.set(bal.currency, existing);
			});

			// Get primary currency balance (usually USD or the first one)
			const primaryCurrency = "USD";
			const primaryBalance = balanceMap.get(primaryCurrency) ||
				balanceMap.values().next().value || {
					available: 0,
					pending: 0,
				};

			// Fetch active subscriptions (from all source tools)
			const activeSubscriptions =
				await prisma.financeSubscription.findMany({
					where: {
						organizationId,
						status: "active",
					},
					include: {
						customer: {
							select: {
								name: true,
								email: true,
							},
						},
					},
				});

			// Calculate MRR (Monthly Recurring Revenue)
			const mrr = activeSubscriptions.reduce((sum, sub) => {
				// Normalize to monthly amount
				let monthlyAmount = sub.amount;
				if (sub.billingCycle === "yearly") {
					monthlyAmount = sub.amount / 12;
				} else if (sub.billingCycle === "quarterly") {
					monthlyAmount = sub.amount / 3;
				}
				return sum + monthlyAmount;
			}, 0);

			// Calculate churn rate
			// Get subscriptions that ended in the last 30 days
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			const churnedSubscriptions = await prisma.financeSubscription.count(
				{
					where: {
						organizationId,
						status: { in: ["canceled", "expired"] },
						endDate: {
							gte: thirtyDaysAgo,
						},
					},
				}
			);

			const totalSubscriptionsLastMonth =
				activeSubscriptions.length + churnedSubscriptions;
			const churnRate =
				totalSubscriptionsLastMonth > 0
					? (churnedSubscriptions / totalSubscriptionsLastMonth) * 100
					: 0;

			// Fetch recent invoices for transactions (from all source tools)
			const recentInvoices = await prisma.invoice.findMany({
				where: {
					organizationId,
					issuedDate: {
						gte: startDate,
					},
				},
				orderBy: {
					issuedDate: "desc",
				},
				take: 10,
				include: {
					customer: {
						select: {
							name: true,
							email: true,
						},
					},
				},
			});

			// Format transactions
			const recentTransactions = recentInvoices.map((invoice) => ({
				id: invoice.id,
				type: invoice.subscriptionId ? "subscription" : "one-time",
				amount: invoice.amountPaid,
				status: invoice.status,
				date: invoice.issuedDate.toISOString(),
				customerName: invoice.customer.name || invoice.customer.email,
			}));

			// Get subscription breakdown by plan (from all source tools)
			const subscriptionBreakdown =
				await prisma.financeSubscription.groupBy({
					by: ["planId"],
					where: {
						organizationId,
						status: "active",
					},
					_count: {
						planId: true,
					},
					_sum: {
						amount: true,
					},
				});

			const subscriptionBreakdownFormatted = subscriptionBreakdown.map(
				(sub) => ({
					planId: sub.planId,
					count: sub._count.planId,
					revenue: sub._sum.amount || 0,
				})
			);

			// Get invoice stats (from all source tools)
			const [
				totalInvoices,
				paidInvoices,
				pendingInvoices,
				overdueInvoices,
			] = await Promise.all([
				prisma.invoice.count({
					where: { organizationId },
				}),
				prisma.invoice.count({
					where: { organizationId, status: "paid" },
				}),
				prisma.invoice.count({
					where: { organizationId, status: "pending" },
				}),
				prisma.invoice.count({
					where: {
						organizationId,
						status: "pending",
						dueDate: {
							lt: new Date(),
						},
					},
				}),
			]);

			const invoiceStats = {
				total: totalInvoices,
				paid: paidInvoices,
				pending: pendingInvoices,
				overdue: overdueInvoices,
			};

			// Fetch historical MRR and churn data for the past 12 months
			const twelveMonthsAgo = new Date();
			twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

			const monthlyMetrics = await Promise.all(
				Array.from({ length: 12 }, (_, i) => {
					const monthStart = new Date();
					monthStart.setMonth(monthStart.getMonth() - (11 - i));
					monthStart.setDate(1);
					monthStart.setHours(0, 0, 0, 0);

					const monthEnd = new Date(monthStart);
					monthEnd.setMonth(monthEnd.getMonth() + 1);

					return (async () => {
						// Fetch subscriptions active during this month
						const subscriptions =
							await prisma.financeSubscription.findMany({
								where: {
									organizationId,
									OR: [
										{ startDate: { lte: monthEnd } },
										{ startDate: { gte: monthStart } },
									],
									status: "active",
								},
							});

						// Calculate MRR for the month
						const monthlyMrr = subscriptions.reduce((sum, sub) => {
							let monthlyAmount = sub.amount;
							if (sub.billingCycle === "yearly") {
								monthlyAmount = sub.amount / 12;
							} else if (sub.billingCycle === "quarterly") {
								monthlyAmount = sub.amount / 3;
							}
							return sum + monthlyAmount;
						}, 0);

						// Calculate churn for the month
						const churned = await prisma.financeSubscription.count({
							where: {
								organizationId,
								status: { in: ["canceled", "expired"] },
								endDate: {
									gte: monthStart,
									lte: monthEnd,
								},
							},
						});

						const totalSubs = subscriptions.length + churned;
						const monthlyChurn =
							totalSubs > 0 ? (churned / totalSubs) * 100 : 0;

						return {
							name: monthStart.toLocaleString("default", {
								month: "short",
							}),
							mrr: Math.round(monthlyMrr),
							churn: parseFloat(monthlyChurn.toFixed(2)),
						};
					})();
				})
			);

			// Fetch transaction volume data for the last 7 days
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			const dailyTransactions = await Promise.all(
				Array.from({ length: 7 }, (_, i) => {
					const dayStart = new Date();
					dayStart.setDate(dayStart.getDate() - (6 - i));
					dayStart.setHours(0, 0, 0, 0);

					const dayEnd = new Date(dayStart);
					dayEnd.setHours(23, 59, 59, 999);

					return (async () => {
						const invoices = await prisma.invoice.findMany({
							where: {
								organizationId,
								issuedDate: {
									gte: dayStart,
									lte: dayEnd,
								},
							},
						});

						const subscriptions = invoices.filter(
							(inv) => inv.subscriptionId
						).length;
						const payments = invoices.filter(
							(inv) => !inv.subscriptionId
						).length;

						return {
							name: `Day ${i + 1}`,
							subscriptions,
							payments,
						};
					})();
				})
			);

			// Generate insight
			const insight = await generateFinancialInsight({
				mrr,
				churnRate,
				activeSubscriptions: activeSubscriptions.length,
				overdueInvoices,
				balance: primaryBalance.available,
			});

			return NextResponse.json({
				mrr: Math.round(mrr),
				churn: parseFloat(churnRate.toFixed(2)),
				activeSubscriptions: activeSubscriptions.length,
				recentTransactions,
				insight,
				balance: {
					available: primaryBalance.available,
					pending: primaryBalance.pending,
					currency: primaryCurrency,
				},
				balanceBreakdown: balances.map((bal) => ({
					sourceTool: bal.sourceTool,
					currency: bal.currency,
					available: bal.availableAmount,
					pending: bal.pendingAmount,
					updatedAt: bal.updatedAt,
				})),
				subscriptionBreakdown: subscriptionBreakdownFormatted,
				invoiceStats,
				mrrTrendData: monthlyMetrics,
				transactionVolumeData: dailyTransactions,
			});
		} catch (error) {
			console.error("[Finance API] Error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch financial data" },
				{ status: 500 }
			);
		}
	});
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, data } = body;

		switch (action) {
			case "updateBalance":
				const balance = await updateBalance(data);
				return NextResponse.json({ success: true, data: balance });
			default:
				return NextResponse.json(
					{ error: "Invalid action" },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error("[Finance API] POST Error:", error);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 }
		);
	}
}
