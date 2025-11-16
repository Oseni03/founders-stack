// actions/design.ts (Server Actions)
"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateDesignStatus(id: string, status: string) {
	await prisma.designFile.update({
		where: { id },
		data: { status },
	});
	revalidatePath(`/design/${id}`);
	revalidatePath("/design");
}

// Add similar actions for addComment, etc.
