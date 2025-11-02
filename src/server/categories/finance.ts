/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";

export async function updateBalance(data: any) {
	const {
		organizationId,
		sourceTool,
		currency,
		availableAmount,
		pendingAmount,
	} = data;

	if (!sourceTool) {
		throw new Error("sourceTool is required");
	}

	const balance = await prisma.balance.upsert({
		where: {
			organizationId_sourceTool: {
				organizationId,
				sourceTool,
			},
		},
		update: {
			currency,
			availableAmount,
			pendingAmount,
			updatedAt: new Date(),
		},
		create: {
			organizationId,
			sourceTool,
			currency,
			availableAmount,
			pendingAmount,
		},
	});

	return balance;
}

export async function generateFinancialInsight(metrics: {
	mrr: number;
	churnRate: number;
	activeSubscriptions: number;
	overdueInvoices: number;
	balance: number;
}): Promise<string> {
	const insights = [];

	if (metrics.mrr > 10000) {
		insights.push(
			`Strong MRR of $${Math.round(metrics.mrr).toLocaleString()}`
		);
	}

	if (metrics.churnRate > 5) {
		insights.push(
			`Churn rate of ${metrics.churnRate.toFixed(1)}% needs attention`
		);
	} else if (metrics.churnRate < 2) {
		insights.push("Excellent customer retention with low churn");
	}

	if (metrics.overdueInvoices > 0) {
		insights.push(
			`${metrics.overdueInvoices} overdue invoices require follow-up`
		);
	}

	if (metrics.activeSubscriptions > 100) {
		insights.push("Healthy subscriber base");
	}

	if (metrics.balance > 50000) {
		insights.push("Strong cash position");
	}

	return insights.length > 0
		? insights.join(". ") + "."
		: "Financial metrics are within normal ranges.";
}

// Add this helper function at the top of the file, after imports
export async function calculateMRRTrend(organizationId: string, range: string) {
	const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

	// Determine number of data points based on range
	const dataPoints = range === "7d" ? 7 : range === "30d" ? 4 : 12;
	const intervalDays = Math.floor(days / dataPoints);

	const trendData = [];
	const now = new Date();

	for (let i = dataPoints - 1; i >= 0; i--) {
		const periodEnd = new Date(now);
		periodEnd.setDate(now.getDate() - i * intervalDays);
		periodEnd.setHours(23, 59, 59, 999);

		const periodStart = new Date(periodEnd);
		periodStart.setDate(periodEnd.getDate() - intervalDays + 1);
		periodStart.setHours(0, 0, 0, 0);

		// Get active subscriptions during this period
		const periodSubs = await prisma.financeSubscription.findMany({
			where: {
				organizationId,
				status: { in: ["active", "trialing"] },
				startDate: { lte: periodEnd },
				OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
			},
			select: {
				amount: true,
				billingCycle: true,
				endDate: true,
			},
		});

		// Calculate MRR for this period
		const periodMrr = periodSubs.reduce(
			(sum, s) =>
				sum + (s.billingCycle === "yearly" ? s.amount / 12 : s.amount),
			0
		);

		// Calculate churn for this period
		// Count subscriptions that ended during this period
		const churnedSubs = await prisma.financeSubscription.count({
			where: {
				organizationId,
				endDate: {
					gte: periodStart,
					lte: periodEnd,
				},
				status: { in: ["cancelled", "expired"] },
			},
		});

		// Count total active subscriptions at start of period
		const totalSubsAtStart = await prisma.financeSubscription.count({
			where: {
				organizationId,
				startDate: { lte: periodStart },
				OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
			},
		});

		const churnRate =
			totalSubsAtStart > 0 ? (churnedSubs / totalSubsAtStart) * 100 : 0;

		// Format the period name
		let periodName: string;
		if (dataPoints === 7) {
			// For 7d range: show day names (Mon, Tue, etc.)
			periodName = periodEnd.toLocaleDateString("en-US", {
				weekday: "short",
			});
		} else if (dataPoints === 4) {
			// For 30d range: show week numbers
			periodName = `Week ${dataPoints - i}`;
		} else {
			// For 90d range: show month names
			periodName = periodEnd.toLocaleDateString("en-US", {
				month: "short",
			});
		}

		trendData.push({
			name: periodName,
			mrr: Math.round(periodMrr),
			churn: parseFloat(churnRate.toFixed(1)),
		});
	}

	return trendData;
}
