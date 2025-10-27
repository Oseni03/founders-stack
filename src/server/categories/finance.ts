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
