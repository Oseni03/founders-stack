import { auth } from "@/lib/auth";
import { withAuth } from "@/lib/middleware";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ toolName: string }> }
) {
	return withAuth(request, async (request, user, session) => {
		const { toolName } = await params;
		try {
			// OAuth flow - redirect to provider's authorization URL

			const data = await auth.api.oAuth2LinkAccount({
				body: {
					providerId: toolName,
					callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/${toolName}/onboarding`,
				},
				use: [
					async () => {
						// The middleware receives a context object
						// You need to return the session object with both session and user
						return {
							session: {
								session: session, // Your session object
								user: user, // Your user object
							},
						};
					},
				],
				// This endpoint requires session cookies.
				headers: await headers(),
			});

			return NextResponse.json(data);
		} catch (error) {
			console.error(`Failed to connect ${toolName}`, error);
			return NextResponse.json(
				{ error: `Failed to fetch conect ${toolName}` },
				{ status: 500 }
			);
		}
	});
}
