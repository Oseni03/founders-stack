/* eslint-disable @typescript-eslint/no-explicit-any */
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
				const channelId = searchParams.get("channelId");
				const limit = parseInt(searchParams.get("limit") || "50");
				const cursor = searchParams.get("cursor");
				const includeThreads =
					searchParams.get("includeThreads") === "true";
				const onlyMentions =
					searchParams.get("onlyMentions") === "true";
				const search = searchParams.get("search");

				const where: any = {
					organizationId: user.organizationId,
				};

				if (channelId) {
					where.projectId = channelId;
				}

				if (onlyMentions && user.id) {
					where.mentions = {
						has: user.id,
					};
				}

				if (search) {
					where.content = {
						contains: search,
						mode: "insensitive",
					};
				}

				if (!includeThreads) {
					where.parentMessageId = null;
				}

				const messages = await prisma.message.findMany({
					where,
					take: limit + 1,
					...(cursor && {
						cursor: { id: cursor },
						skip: 1,
					}),
					orderBy: {
						timestamp: "desc",
					},
					include: {
						linkedItems: {
							include: {
								task: {
									select: {
										id: true,
										title: true,
										status: true,
									},
								},
								design: {
									select: { id: true, name: true, url: true },
								},
							},
						},
						comments: {
							take: 5,
							orderBy: { createdAt: "desc" },
						},
					},
				});

				const hasMore = messages.length > limit;
				const data = hasMore ? messages.slice(0, -1) : messages;
				const nextCursor = hasMore ? data[data.length - 1].id : null;

				return NextResponse.json({
					messages: data,
					nextCursor,
					hasMore,
				});
			} catch (error) {
				console.error("Error fetching messages:", error);
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
					channelId,
					content,
					externalId,
					platform,
					integrationId,
					mentions,
					attachments,
					parentMessageId,
					threadId,
				} = body;

				const message = await prisma.message.create({
					data: {
						externalId: externalId || `msg_${Date.now()}`,
						organizationId: user.organizationId,
						projectId: channelId,
						integrationId,
						platform,
						channelId,
						channelName: "", // Will be populated
						channelType: "CHANNEL",
						content,
						authorId: user.id,
						authorName: user.name || "Unknown",
						authorAvatar: user.image,
						mentions: mentions || [],
						attachments: attachments || {},
						hasAttachments:
							!!attachments &&
							Object.keys(attachments).length > 0,
						parentMessageId,
						threadId,
						timestamp: new Date(),
						isPinned: false,
						isImportant: false,
					},
				});

				return NextResponse.json({ message }, { status: 201 });
			} catch (error) {
				console.error("Error creating message:", error);
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}
