import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { deleteRepository, getRepositories } from "@/server/categories/code";

export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			const repositories = await getRepositories(user.organizationId);

			return NextResponse.json({ data: repositories }, { status: 200 });
		} catch (error) {
			console.error("Error fetching repositories:", error);
			return NextResponse.json(
				{ error: "Internal Server Error" },
				{ status: 500 }
			);
		}
	});
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action, data } = body;

		switch (action) {
			case "deleteRepository":
				await deleteRepository(data.repositoryId);
				return NextResponse.json({
					success: true,
				});
			default:
				return NextResponse.json(
					{ error: "Invalid action" },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error("[Repositories API] POST Error:", error);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 }
		);
	}
}
