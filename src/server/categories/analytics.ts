"use server";
import { prisma } from "@/lib/prisma";
import type { AnalyticsData } from "@prisma/client";

export async function getAnalyticsData(
	organizationId: string
): Promise<AnalyticsData[]> {
	return prisma.analyticsData.findMany({
		where: { organizationId },
		orderBy: { timestamp: "desc" },
	});
}
