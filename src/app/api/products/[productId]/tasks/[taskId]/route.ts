/* eslint-disable @typescript-eslint/no-explicit-any */
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
	req: NextRequest,
	{ params }: { params: { organizationId: string; taskId: string } }
) {
	return withAuth(req, async (request, user) => {
		try {
			const { organizationId, taskId } = params;

			// Verify organization access
			if (organizationId !== user.organizationId) {
				return NextResponse.json(
					{ error: "Forbidden" },
					{ status: 403 }
				);
			}

			// Delete task locally only (not from external platform)
			const task = await prisma.task.delete({
				where: {
					id: taskId,
					organizationId,
				},
			});

			return NextResponse.json({ success: true, deletedTask: task });
		} catch (error: any) {
			console.error("Error deleting task:", error);
			return NextResponse.json(
				{ error: error.message || "Internal server error" },
				{ status: 500 }
			);
		}
	});
}
