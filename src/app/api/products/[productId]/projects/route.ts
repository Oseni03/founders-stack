import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	const { productId } = await params;
	return withAuth(req, async () => {
		try {
			const { searchParams } = new URL(req.url);
			const status = searchParams.get("status") || "active";

			const projects = await prisma.project.findMany({
				where: {
					organizationId: productId,
					status,
				},
				include: {
					tasks: {
						select: {
							id: true,
							status: true,
							priority: true,
						},
					},
					_count: {
						select: {
							tasks: true,
						},
					},
				},
				orderBy: { updatedAt: "desc" },
			});

			const projectsWithMetrics = projects.map((project) => ({
				id: project.id,
				name: project.name,
				description: project.description,
				externalId: project.externalId,
				platform: project.platform,
				attributes: project.attributes,
				status: project.status,
				taskCount: project._count.tasks,
				openTasks: project.tasks.filter((t) => t.status !== "done")
					.length,
				createdAt: project.createdAt,
				updatedAt: project.updatedAt,
			}));

			return NextResponse.json({ projects: projectsWithMetrics });
		} catch (error) {
			console.error("Error fetching projects:", error);
			return NextResponse.json(
				{ error: "Failed to fetch projects" },
				{ status: 500 }
			);
		}
	});
}
