import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";

const prisma = new PrismaClient();

// Schema definitions
const feedbackQuerySchema = z.object({
	organizationId: z.string(),
	timeRange: z.enum(["7d", "30d", "custom"]).optional().default("30d"),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	source: z.string().optional(),
	type: z.string().optional(),
	status: z.string().optional(),
	sentiment: z.string().optional(),
	category: z.string().optional(),
	page: z.coerce.number().min(1).optional().default(1),
	pageSize: z.coerce.number().min(1).max(100).optional().default(20),
});

const feedbackUpdateSchema = z.object({
	id: z.string(),
	status: z.string().optional(),
	priority: z.string().optional(),
	category: z.string().optional(),
	tags: z.array(z.string()).optional(),
	assignedTo: z.string().optional(),
	linkedFeature: z.string().optional(),
});

const feedbackReplySchema = z.object({
	feedbackId: z.string(),
	content: z.string(),
	integrationId: z.string(),
});

// GET: Fetch feedback list with filters
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string; action: string }> }
) {
	const { productId } = await params;
	return withAuth(
		request,
		async (request) => {
			try {
				const { searchParams } = new URL(request.url);
				const parsed = feedbackQuerySchema.safeParse({
					organizationId: searchParams.get("organizationId"),
					timeRange: searchParams.get("timeRange"),
					startDate: searchParams.get("startDate"),
					endDate: searchParams.get("endDate"),
					source: searchParams.get("source"),
					type: searchParams.get("type"),
					status: searchParams.get("status"),
					sentiment: searchParams.get("sentiment"),
					category: searchParams.get("category"),
					page: searchParams.get("page"),
					pageSize: searchParams.get("pageSize"),
				});

				if (!parsed.success) {
					return NextResponse.json(
						{ error: parsed.error.issues },
						{ status: 400 }
					);
				}

				const {
					organizationId,
					timeRange,
					startDate,
					endDate,
					source,
					type,
					status,
					sentiment,
					category,
					page,
					pageSize,
				} = parsed.data;

				const dateFilter =
					timeRange === "custom" && startDate && endDate
						? {
								createdAt: {
									gte: new Date(startDate),
									lte: new Date(endDate),
								},
							}
						: {
								createdAt: {
									gte: new Date(
										Date.now() -
											(timeRange === "7d" ? 7 : 30) *
												24 *
												60 *
												60 *
												1000
									),
								},
							};

				const where = {
					organizationId,
					platform: source ? { equals: source } : undefined,
					type: type ? { equals: type } : undefined,
					status: status ? { equals: status } : undefined,
					sentiment: sentiment ? { equals: sentiment } : undefined,
					category: category ? { equals: category } : undefined,
					...dateFilter,
				};

				const [
					feedbackItems,
					totalFeedback,
					statusCounts,
					categoryCounts,
					sentimentCounts,
				] = await Promise.all([
					prisma.feedbackItem.findMany({
						where,
						include: {
							comments: { select: { id: true } },
						},
						orderBy: { createdAt: "desc" },
						skip: (page - 1) * pageSize,
						take: pageSize,
					}),
					prisma.feedbackItem.count({ where }),
					prisma.feedbackItem.groupBy({
						by: ["status"],
						where,
						_count: { id: true },
					}),
					prisma.feedbackItem.groupBy({
						by: ["category"],
						where,
						_count: { id: true },
					}),
					prisma.feedbackItem.groupBy({
						by: ["sentiment"],
						where,
						_count: { id: true },
					}),
				]);

				// Mock sentiment trend and common terms (use NLP service in production)
				const sentimentTrend = Array.from({
					length: timeRange === "7d" ? 7 : 30,
				}).map((_, i) => ({
					date: new Date(
						Date.now() - i * 24 * 60 * 60 * 1000
					).toISOString(),
					positive: Math.floor(Math.random() * 50),
					negative: Math.floor(Math.random() * 20),
					neutral: Math.floor(Math.random() * 30),
				}));

				const commonTerms = [
					{ term: "dashboard", count: 150 },
					{ term: "export", count: 100 },
					{ term: "dark mode", count: 80 },
				];

				const npsScore = 65; // Mocked, calculate from survey data in production

				const data = {
					totalFeedback,
					averageSentimentScore:
						feedbackItems.reduce(
							(sum, item) => sum + (item.sentimentScore || 0),
							0
						) / feedbackItems.length || 0,
					totalComments: feedbackItems.reduce(
						(sum, item) => sum + item.comments.length,
						0
					),
					npsScore,
					feedbackByStatus: statusCounts.map((s) => ({
						name: s.status,
						value: s._count.id,
					})),
					feedbackByCategory: categoryCounts.map((c) => ({
						name: c.category || "Uncategorized",
						value: c._count.id,
					})),
					feedbackBySentiment: sentimentCounts.map((s) => ({
						name: s.sentiment || "Unknown",
						value: s._count.id,
					})),
					recentFeedback: feedbackItems.map((item) => ({
						id: item.id,
						externalId: item.externalId,
						title: item.title,
						description: item.description,
						platform: item.platform,
						status: item.status,
						priority: item.priority || undefined,
						sentiment: item.sentiment || undefined,
						sentimentScore: item.sentimentScore || undefined,
						category: item.category || undefined,
						tags: item.tags,
						votes: item.votes,
						userId: item.userId || undefined,
						userName: item.userName || undefined,
						userEmail: item.userEmail || undefined,
						userSegment: item.userSegment || undefined,
						assignedTo: item.assignedTo || undefined,
						linkedFeature: item.linkedFeature || undefined,
						url: item.url || undefined,
						createdAt: item.createdAt.toISOString(),
						updatedAt: item.updatedAt.toISOString(),
						commentsCount: item.comments.length,
					})),
					topFeatureRequests: feedbackItems
						.filter((item) => item.type === "FEATURE_REQUEST")
						.sort((a, b) => b.votes - a.votes)
						.slice(0, 10),
					sentimentTrend,
					commonTerms,
				};

				return NextResponse.json(data);
			} catch (error) {
				console.error(error);
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}

// PATCH: Update a single feedback item or bulk triage
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string; action: string }> }
) {
	const { productId, action } = await params;
	return withAuth(
		request,
		async (request) => {
			try {
				if (action === "update") {
					const body = await request.json();
					const parsed = feedbackUpdateSchema.safeParse(body);
					if (!parsed.success) {
						return NextResponse.json(
							{ error: parsed.error.issues },
							{ status: 400 }
						);
					}

					const { id, ...updates } = parsed.data;

					const feedback = await prisma.feedbackItem.update({
						where: { id },
						data: {
							...updates,
							updatedAt: new Date(),
						},
						include: { comments: { select: { id: true } } },
					});

					return NextResponse.json({
						...feedback,
						createdAt: feedback.createdAt.toISOString(),
						updatedAt: feedback.updatedAt.toISOString(),
						commentsCount: feedback.comments.length,
					});
				} else if (action === "bulk-triage") {
					const body = await request.json();
					const schema = z.array(
						z.object({
							id: z.string(),
							status: z.string().optional(),
							category: z.string().optional(),
							assignedTo: z.string().optional(),
						})
					);
					const parsed = schema.safeParse(body);
					if (!parsed.success) {
						return NextResponse.json(
							{ error: parsed.error.issues },
							{ status: 400 }
						);
					}

					const updates = parsed.data.map((item) =>
						prisma.feedbackItem.update({
							where: { id: item.id },
							data: {
								status: item.status,
								category: item.category,
								assignedTo: item.assignedTo,
								updatedAt: new Date(),
							},
						})
					);

					await prisma.$transaction(updates);
					return NextResponse.json({
						message: "Feedback items updated",
					});
				}

				return NextResponse.json(
					{ error: "Endpoint not found" },
					{ status: 404 }
				);
			} catch (error) {
				console.error(error);
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}

// POST: Reply to a feedback item
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string; action: string }> }
) {
	const { productId, action } = await params;
	return withAuth(
		request,
		async (request, user) => {
			if (action !== "reply") {
				return NextResponse.json(
					{ error: "Endpoint not found" },
					{ status: 404 }
				);
			}

			try {
				const body = await request.json();
				const parsed = feedbackReplySchema.safeParse(body);
				if (!parsed.success) {
					return NextResponse.json(
						{ error: parsed.error.issues },
						{ status: 400 }
					);
				}

				const { feedbackId, content, integrationId } = parsed.data;

				// Mock reply to external platform (e.g., Zendesk, Intercom)
				// In production, call the platform's API using integration credentials
				const comment = await prisma.comment.create({
					data: {
						content,
						organizationId: productId,
						entityId: feedbackId,
						entityType: "FEEDBACK",
						authorId: user.id,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				return NextResponse.json(comment);
			} catch (error) {
				console.error(error);
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}
