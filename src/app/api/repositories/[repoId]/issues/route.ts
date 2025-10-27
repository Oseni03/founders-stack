import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { getIssues } from "@/server/categories/code";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ repoId: string }> }
) {
	return withAuth(request, async (request, user) => {
		const { repoId } = await params;
		try {
			const issues = await getIssues(user.organizationId, repoId);

			return NextResponse.json({ data: issues || [] }, { status: 200 });
		} catch (error) {
			console.error("Error fetching issues:", error);
			return NextResponse.json(
				{ error: "Internal Server Error" },
				{ status: 500 }
			);
		}
	});
}
