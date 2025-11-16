"use server";

import { prisma } from "@/lib/prisma"; // Assume Prisma client setup

export async function getTickets({
	organizationId,
}: {
	organizationId: string;
}) {
	return prisma.supportTicket.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
	});
}

export async function getTicket(id: string, organizationId: string) {
	return prisma.supportTicket.findUnique({
		where: { id, organizationId },
		// Add includes for comments, etc.
	});
}
