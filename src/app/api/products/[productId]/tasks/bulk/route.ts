import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bulkUpdateSchema = z.object({
	taskIds: z.array(z.string()),
	updates: z.object({
		status: z.string().optional(),
		priority: z.string().optional(),
		assigneeId: z.string().nullable().optional(),
	}),
});

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	const { productId } = await params;
	return withAuth(req, async (request, user) => {
		try {
			if (
				!user.role ||
				!["owner", "admin", "member"].includes(user.role)
			) {
				return NextResponse.json(
					{ error: "Forbidden" },
					{ status: 403 }
				);
			}

			const body = await req.json();
			const { taskIds, updates } = bulkUpdateSchema.parse(body);

			// Update all tasks
			await prisma.task.updateMany({
				where: {
					id: { in: taskIds },
					organizationId: productId,
				},
				data: {
					...updates,
					syncedAt: new Date(),
				},
			});

			// Fetch updated tasks
			const tasks = await prisma.task.findMany({
				where: {
					id: { in: taskIds },
					organizationId: productId,
				},
				include: {
					project: true,
					integration: true,
					assignee: true,
				},
			});

			return NextResponse.json({ tasks });
		} catch (error) {
			console.error("Error bulk updating tasks:", error);
			return NextResponse.json(
				{ error: "Failed to bulk update tasks" },
				{ status: 500 }
			);
		}
	});
}
