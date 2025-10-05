import { withAuth } from "@/lib/middleware";
import { getIntegrations } from "@/server/integrations";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	return withAuth(req, async (request, user) => {
		try {
			const integrations = await getIntegrations(user.organizationId);
			return NextResponse.json({ integrations });
		} catch (error) {
			console.log("Error getting integrations: ", error);
			return NextResponse.json(
				{ error: "Failed to fetch integrations" },
				{ status: 500 }
			);
		}
	});
}
