import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { getCommits } from "@/server/code";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ repoId: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { repoId } = await params;
		try {
			const commits = await getCommits(user.organizationId, repoId);

			return NextResponse.json({ data: commits || [] }, { status: 200 });
		} catch (error) {
			console.error("Error fetching commits:", error);
			return NextResponse.json(
				{ error: "Internal Server Error" },
				{ status: 500 }
			);
		}
	});
}
