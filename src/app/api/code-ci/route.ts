// app/api/code-ci/route.ts
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod"; // Input validation

// Schema for query params
const querySchema = z.object({
	repositoryId: z.string().cuid(), // Validate as Prisma cuid
});

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
export async function GET(req: NextRequest) {
	return withAuth(req, async (request, user) => {
		// // Rate limit check
		// if (!(await rateLimit(user.id))) {
		// 	return NextResponse.json(
		// 		{ error: "Rate limit exceeded" },
		// 		{ status: 429 }
		// 	);
		// }

		const { searchParams } = new URL(req.url);
		const parsed = querySchema.safeParse({
			repositoryId: searchParams.get("repositoryId"),
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid repositoryId" },
				{ status: 400 }
			);
		}

		const { repositoryId } = parsed.data;
		const orgId = user.organizationId; // Assume user model has organizationId

		try {
			// Verify repo belongs to org
			const repo = await prisma.repository.findUnique({
				where: { id: repositoryId },
				select: {
					id: true,
					organizationId: true,
					name: true,
					owner: true,
					language: true,
					isPrivate: true,
				},
			});
			if (!repo || repo.organizationId !== orgId) {
				return NextResponse.json(
					{ error: "Repository not found" },
					{ status: 404 }
				);
			}

			// Fetch all repositories for the org (for frontend list)
			const repositories = await prisma.repository.findMany({
				where: { organizationId: orgId, isArchived: false },
				select: {
					id: true,
					name: true,
					owner: true,
					language: true,
					isPrivate: true,
				},
			});

			// Aggregate commits count (last 30 days for "this period")
			const thirtyDaysAgo = new Date(
				Date.now() - 30 * 24 * 60 * 60 * 1000
			);
			const commits = await prisma.commit.count({
				where: { repositoryId, committedAt: { gte: thirtyDaysAgo } },
			});

			// Aggregate PRs count (open + merged)
			const prs = await prisma.pullRequest.count({
				where: { repositoryId, status: { in: ["open", "merged"] } },
			});

			// Fetch health (assume pre-computed; or compute here)
			const health = (await prisma.repositoryHealth.findUnique({
				where: { repositoryId },
				select: {
					healthScore: true,
					openIssues: true,
					stalePrs: true,
					avgReviewTime: true,
					testCoverage: true,
				},
			})) ?? {
				healthScore: 0,
				openIssues: 0,
				stalePrs: 0,
				avgReviewTime: 0,
				testCoverage: 0,
			};

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

			// Mocked/computed fields (expand with real logic)
			const buildStatus = "success"; // From latest DeploymentEvent
			const buildSuccessRate = 95.5; // Compute from DeploymentEvent statuses
			const insight =
				"Repository health is strong, but monitor open issues."; // AI-generated in future

			return NextResponse.json({
				repositories,
				commits,
				prs,
				buildStatus,
				buildSuccessRate,
				repositoryHealth: health,
				recentCommits,
				recentPullRequests,
				topContributors,
				recentDeploys,
				insight,
			});
		} catch (error) {
			console.error("Code/CI API error:", error); // Log to Sentry in prod
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	});
}
