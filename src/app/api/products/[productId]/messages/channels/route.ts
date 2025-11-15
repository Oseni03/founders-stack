/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	const { productId } = await params;
	return withAuth(
		req,
		async (request, user) => {
			try {
				const { searchParams } = new URL(req.url);
				const includeArchived =
					searchParams.get("includeArchived") === "true";
				const platform = searchParams.get("platform");

				const channels = await prisma.project.findMany({
					where: {
						organizationId: user.organizationId,
						status: includeArchived ? undefined : "active",
						platform: platform || undefined,
						attributes: {
							path: ["is_channel"],
							equals: true,
						},
					},
					select: {
						id: true,
						name: true,
						description: true,
						externalId: true,
						platform: true,
						attributes: true,
						status: true,
						createdAt: true,
						updatedAt: true,
						_count: {
							select: {
								messages: true,
							},
						},
					},
					orderBy: [{ updatedAt: "desc" }],
				});

				// Transform to Channel format
				const formattedChannels = channels.map((channel) => {
					const attrs = (channel.attributes as any) || {};
					return {
						id: channel.id,
						name: channel.name,
						description: channel.description,
						type: attrs.type || "CHANNEL",
						isPrivate: attrs.is_private || false,
						unreadCount: 0, // Will be calculated separately
						isMuted: false, // Store in user preferences
						isFavorite: false, // Store in user preferences
						lastMessageTime: channel.updatedAt,
						platform: channel.platform || "slack",
						externalId: channel.externalId,
						memberCount: attrs.num_members,
						messageCount: channel._count.messages,
						attributes: attrs,
					};
				});

				return NextResponse.json({ channels: formattedChannels });
			} catch (error) {
				console.error("Error fetching channels:", error);
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	const { productId } = await params;
	return withAuth(
		req,
		async (request, user) => {
			try {
				const body = await req.json();
				const {
					name,
					description,
					type,
					isPrivate,
					platform,
					externalId,
					integrationId,
				} = body;

				const channel = await prisma.project.create({
					data: {
						organizationId: user.organizationId,
						name,
						description,
						externalId,
						platform,
						status: "active",
						attributes: {
							is_channel: true,
							type: type || "CHANNEL",
							is_private: isPrivate || false,
						},
					},
				});

				return NextResponse.json({ channel }, { status: 201 });
			} catch (error) {
				console.error("Error creating channel:", error);
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}
