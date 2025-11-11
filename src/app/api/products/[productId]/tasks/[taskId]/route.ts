/* eslint-disable @typescript-eslint/no-explicit-any */
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; taskId: string }> }
) {
	const { productId, taskId } = await params;

	return withAuth(req, async (request, user) => {
		try {
			// Verify organization access
			if (productId !== user.organizationId) {
				return NextResponse.json(
					{ error: "Forbidden" },
					{ status: 403 }
				);
			}

			// Ensure taskId is provided (either query param or path param)
			if (!taskId) {
				return NextResponse.json(
					{ error: "taskId is required" },
					{ status: 400 }
				);
			}

			// Delete task locally only (not from external platform)
			const task = await prisma.task.delete({
				where: {
					id: taskId,
					organizationId: productId,
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
