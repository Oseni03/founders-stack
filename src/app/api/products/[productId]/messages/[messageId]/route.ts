import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; messageId: string }> }
) {
	const { productId, messageId } = await params;
	return withAuth(
		req,
		async (request, user) => {
			try {
				const body = await req.json();
				const { content, isPinned, isImportant, reactions } = body;

				const message = await prisma.message.update({
					where: {
						id: messageId,
						organizationId: user.organizationId,
					},
					data: {
						...(content !== undefined && { content }),
						...(isPinned !== undefined && { isPinned }),
						...(isImportant !== undefined && { isImportant }),
						...(reactions !== undefined && { reactions }),
					},
				});

				return NextResponse.json({ message });
			} catch (error) {
				console.error("Error updating message:", error);
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}
