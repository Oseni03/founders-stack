import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// app/api/organizations/[orgId]/tasks/[taskId]/comments/route.ts
const commentSchema = z.object({
	content: z.string().min(1),
	metadata: z.any().optional(),
});

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; taskId: string }> }
) {
	const { productId, taskId } = await params;
	return withAuth(req, async (request, user) => {
		try {
			const body = await req.json();
			const data = commentSchema.parse(body);

			const comment = await prisma.comment.create({
				data: {
					content: data.content,
					// metadata: data.metadata,
					authorId: user.id,
					entityId: taskId,
					entityType: "TASK",
					organizationId: productId,
				},
				include: {
					author: {
						select: {
							id: true,
							name: true,
							email: true,
							image: true,
						},
					},
				},
			});

			return NextResponse.json({ comment });
		} catch (error) {
			console.error("Error creating comment:", error);
			return NextResponse.json(
				{ error: "Failed to create comment" },
				{ status: 500 }
			);
		}
	});
}
