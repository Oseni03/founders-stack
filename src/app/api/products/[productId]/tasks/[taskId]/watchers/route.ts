import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// app/api/organizations/[orgId]/tasks/[taskId]/watchers/route.ts
export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; taskId: string }> }
) {
	const { productId, taskId } = await params;
	return withAuth(req, async (request, user) => {
		try {
			// Add watcher
			const watcher = await prisma.taskWatcher.create({
				data: {
					userId: user.id,
					taskId: taskId,
					organizationId: productId,
				},
			});

			return NextResponse.json({ watcher });
		} catch (error) {
			console.error("Error adding watcher:", error);
			return NextResponse.json(
				{ error: "Failed to add watcher" },
				{ status: 500 }
			);
		}
	});
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; taskId: string }> }
) {
	const { productId, taskId } = await params;
	return withAuth(req, async (request, user) => {
		try {
			await prisma.taskWatcher.deleteMany({
				where: {
					userId: user.id,
					taskId,
					organizationId: productId,
				},
			});

			return NextResponse.json({ success: true });
		} catch (error) {
			console.error("Error removing watcher:", error);
			return NextResponse.json(
				{ error: "Failed to remove watcher" },
				{ status: 500 }
			);
		}
	});
}
