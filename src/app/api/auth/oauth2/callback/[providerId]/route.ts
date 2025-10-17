import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ providerId: string }> }
) {
	const { providerId } = await params;
	const searchParams = request.nextUrl.searchParams;

	try {
		const response = await auth.api.oAuth2Callback({
			query: {
				code: searchParams.get("code") || undefined,
				error: searchParams.get("error") || undefined,
				error_description:
					searchParams.get("error_description") || undefined,
				state: searchParams.get("state") || undefined,
			},
			params: {
				providerId,
			},
			asResponse: true,
		});

		const data = response.json();
		console.log(`OAuth callback response for ${providerId}: `, data);

		return response;
	} catch (error) {
		console.error("OAuth callback error:", error);
		return new Response("Authentication failed", { status: 500 });
	}
}
