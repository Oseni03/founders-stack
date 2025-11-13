import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { computeRepositoryHealth } from "@/server/categories/code";
import { NextRequest, NextResponse } from "next/server";

// Rate limiter setup (optional; configure env vars for Upstash)
// const redis =
// 	process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN
// 		? new Redis({
// 				url: process.env.UPSTASH_REDIS_URL,
// 				token: process.env.UPSTASH_REDIS_TOKEN,
// 			})
// 		: null;

// async function rateLimit(userId: string): Promise<boolean> {
// 	if (!redis) return true; // Skip if not configured
// 	const key = `rate:code-ci:${userId}`;
// 	const count = await redis.incr(key);
// 	if (count === 1) await redis.expire(key, 60); // 1 min window
// 	return count <= 10; // Limit 10/min
// }

// GET: Fetch code/CI metrics for a repository
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string; repositoryId: string }> }
) {
	const { productId, repositoryId } = await params;
	return withAuth(
		req,
		async (request, user) => {
			// // Rate limit check
			// if (!(await rateLimit(user.id))) {
			// 	return NextResponse.json(
			// 		{ error: "Rate limit exceeded" },
			// 		{ status: 429 }
			// 	);
			// }

			try {
				// Verify repo belongs to org
				const repo = await prisma.repository.findUnique({
					where: {
						id: repositoryId,
						organizationId: user.organizationId,
					},
					select: {
						id: true,
						organizationId: true,
						name: true,
						owner: true,
						language: true,
						isPrivate: true,
					},
				});
				if (!repo) {
					return NextResponse.json(
						{ error: "Repository not found" },
						{ status: 404 }
					);
				}

				// Aggregate commits count (last 30 days for "this period")
				const thirtyDaysAgo = new Date(
					Date.now() - 30 * 24 * 60 * 60 * 1000
				);
				const commits = await prisma.commit.count({
					where: {
						repositoryId,
						committedAt: { gte: thirtyDaysAgo },
					},
				});

				// Aggregate PRs count (open + merged)
				const prs = await prisma.pullRequest.count({
					where: { repositoryId, status: { in: ["open", "merged"] } },
				});

				// Fetch health (assume pre-computed; or compute here)
				const health = await computeRepositoryHealth(
					repositoryId,
					productId
				);

				// Recent commits (last 10)
				const recentCommits = await prisma.commit.findMany({
					where: { repositoryId },
					orderBy: { committedAt: "desc" },
					take: 10,
					select: {
						id: true,
						message: true,
						authorName: true,
						avatarUrl: true,
						additions: true,
						deletions: true,
						committedAt: true,
					},
				});

				// Recent PRs (last 10)
				const recentPullRequests = await prisma.pullRequest
					.findMany({
						where: { repositoryId },
						orderBy: { createdAt: "desc" },
						take: 10,
						select: {
							id: true,
							number: true,
							title: true,
							status: true,
							authorId: true, // Map to authorName if needed
							reviewerIds: true, // Compute reviewerCount = length
							avgReviewTime: true,
						},
					})
					.then((prs) =>
						prs.map((pr) => ({
							...pr,
							authorName: "Placeholder Author", // Fetch from User if linked
							reviewerCount: pr.reviewerIds.length,
						}))
					);

				// Top contributors (top 5 by contributions)
				const topContributors = await prisma.contributor.findMany({
					where: { repositoryId },
					orderBy: { contributions: "desc" },
					take: 5,
					select: {
						login: true,
						name: true,
						avatarUrl: true,
						contributions: true,
					},
				});

				// Recent deploys (from DeploymentEvent; assume linked via Commit)
				const recentDeploys = await prisma.deploymentEvent
					.findMany({
						where: { Commit: { repositoryId } },
						orderBy: { deployedAt: "desc" },
						take: 5,
						select: {
							id: true,
							environment: true,
							status: true,
							deployedAt: true,
						},
					})
					.then((deploys) =>
						deploys.map((d) => ({
							id: d.id,
							environment: d.environment,
							status: d.status,
							timestamp: d.deployedAt?.toISOString(),
						}))
					);

				// Compute commit/PR trend data (last 7 days)
				const commitPRData = await Promise.all(
					Array.from({ length: 7 }, async (_, i) => {
						const dayStart = new Date(
							Date.now() - (6 - i) * 24 * 60 * 60 * 1000
						);
						dayStart.setHours(0, 0, 0, 0);
						const dayEnd = new Date(dayStart);
						dayEnd.setHours(23, 59, 59, 999);

						const [commitsCount, prsCount] = await Promise.all([
							prisma.commit.count({
								where: {
									repositoryId,
									committedAt: { gte: dayStart, lte: dayEnd },
								},
							}),
							prisma.pullRequest.count({
								where: {
									repositoryId,
									createdAt: { gte: dayStart, lte: dayEnd },
								},
							}),
						]);

						return {
							name: dayStart.toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
							}),
							commits: commitsCount,
							prs: prsCount,
						};
					})
				);

				// Compute build trend data (last 14 days)
				const buildTrendData = await Promise.all(
					Array.from({ length: 14 }, async (_, i) => {
						const dayStart = new Date(
							Date.now() - (13 - i) * 24 * 60 * 60 * 1000
						);
						dayStart.setHours(0, 0, 0, 0);
						const dayEnd = new Date(dayStart);
						dayEnd.setHours(23, 59, 59, 999);

						const [totalBuilds, successfulBuilds] =
							await Promise.all([
								prisma.deploymentEvent.count({
									where: {
										Commit: { repositoryId },
										deployedAt: {
											gte: dayStart,
											lte: dayEnd,
										},
									},
								}),
								prisma.deploymentEvent.count({
									where: {
										Commit: { repositoryId },
										deployedAt: {
											gte: dayStart,
											lte: dayEnd,
										},
										status: "success",
									},
								}),
							]);

						const successRate =
							totalBuilds > 0
								? Math.round(
										(successfulBuilds / totalBuilds) * 100
									)
								: 0;

						return {
							name: dayStart.toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
							}),
							successRate,
						};
					})
				);

				// Compute overall build status and success rate
				const allDeployments = await prisma.deploymentEvent.findMany({
					where: {
						Commit: { repositoryId },
						deployedAt: { gte: thirtyDaysAgo },
					},
					select: { status: true },
				});

				const latestDeployment = await prisma.deploymentEvent.findFirst(
					{
						where: { Commit: { repositoryId } },
						orderBy: { deployedAt: "desc" },
						select: { status: true },
					}
				);

				const buildStatus = latestDeployment?.status || "unknown";
				const totalDeployments = allDeployments.length;
				const successfulDeployments = allDeployments.filter(
					(d) => d.status === "success"
				).length;
				const buildSuccessRate =
					totalDeployments > 0
						? Math.round(
								(successfulDeployments / totalDeployments) *
									100 *
									10
							) / 10
						: 0;

				// Mocked/computed fields (expand with real logic)
				const insight =
					"Repository health is strong, but monitor open issues."; // AI-generated in future

				return NextResponse.json({
					commits,
					prs,
					buildStatus,
					buildSuccessRate,
					repositoryHealth: health,
					recentCommits,
					recentPullRequests,
					topContributors,
					recentDeploys,
					commitPRData,
					buildTrendData,
					insight,
				});
			} catch (error) {
				console.error("Code/CI API error:", error); // Log to Sentry in prod
				return NextResponse.json(
					{ error: "Internal server error" },
					{ status: 500 }
				);
			}
		},
		productId
	);
}
