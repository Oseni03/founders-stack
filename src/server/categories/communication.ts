"use server";

import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function getMessages(organizationId: string) {
	const session = await getSession();
	if (!session?.user.id) throw new Error("Unauthorized");

	return prisma.message.findMany({
		where: { organizationId },
		orderBy: { timestamp: "desc" },
		include: { comments: true, linkedItems: true },
	});
}
