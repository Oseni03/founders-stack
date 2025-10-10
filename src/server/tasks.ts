"use server";

import { prisma } from "@/lib/prisma";

export async function getTasks(organizationId: string) {
	const tasks = await prisma.task.findMany({ where: { organizationId } });
	return tasks;
}
