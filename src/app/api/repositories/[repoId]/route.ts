import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { deleteRepository, getRepository } from "@/server/categories/code";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ repoId: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { repoId } = await params;
		try {
			const repository = await getRepository(repoId, user.organizationId);

			if (!repository) {
				return NextResponse.json(
					{ error: "Repository not found" },
					{ status: 404 }
				);
			}

			return NextResponse.json({ data: repository }, { status: 200 });
		} catch (error) {
			console.error("Error fetching repository:", error);
			return NextResponse.json(
				{ error: "Internal Server Error" },
				{ status: 500 }
			);
		}
	});
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ repoId: string }> }
) {
	return withAuth(request, async () => {
		const { repoId } = await params;
		try {
			await deleteRepository(repoId);

			return NextResponse.json({ success: true }, { status: 200 });
		} catch (error) {
			console.error("Error deleting repository:", error);
			return NextResponse.json(
				{ error: "Internal Server Error" },
				{ status: 500 }
			);
		}
	});
}
