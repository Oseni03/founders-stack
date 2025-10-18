import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ providerId: string }> }
) {
	const { providerId } = await params;
	const searchParams = request.nextUrl.searchParams;

	try {
		const { response: result, headers } = await auth.api.oAuth2Callback({
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
			returnHeaders: true, // Get headers instead of Response object
		});

		console.log("OAuth callback completed");
		console.log("OAuth result: ", result);
		console.log("Response headers:", Object.fromEntries(headers.entries()));

		// The callback handler typically redirects, so we need to follow that
		const location = headers.get("location");
		if (location) {
			return NextResponse.redirect(location);
		}

		// If no redirect, return success
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("OAuth callback error:", error);

		return NextResponse.redirect(new URL(`/auth/error`, request.url));
	}
}
