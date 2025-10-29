import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { getRepositories } from "@/server/categories/code";

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
