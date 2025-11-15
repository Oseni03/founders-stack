import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; channelId: string }> }
) {
	const { productId, channelId } = await params;
	return withAuth(
		req,
		async (request, user) => {
			try {
				const body = await req.json();
				const { name, description, status, attributes } = body;

				const channel = await prisma.project.update({
					where: {
						id: channelId,
						organizationId: user.organizationId,
					},
					data: {
						...(name && { name }),
						...(description !== undefined && { description }),
						...(status && { status }),
						...(attributes && {
							attributes: {
								...attributes,
								is_channel: true,
							},
						}),
					},
				});

				return NextResponse.json({ channel });
			} catch (error) {
				console.error("Error updating channel:", error);
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; channelId: string }> }
) {
	const { productId, channelId } = await params;
	return withAuth(
		req,
		async (request, user) => {
			try {
				await prisma.project.delete({
					where: {
						id: channelId,
						organizationId: user.organizationId,
					},
				});

				return NextResponse.json({ success: true });
			} catch (error) {
				console.error("Error deleting channel:", error);
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}
