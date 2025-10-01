import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
	// Get the session from the request
	const session = getSessionCookie(request);

	// If no valid session exists, redirect to login with return URL
	if (!session) {
		const loginUrl = new URL("/login", request.url);
		// Add the current URL as a return URL parameter
		loginUrl.searchParams.set(
			"callbackUrl",
			request.nextUrl.pathname + request.nextUrl.search
		);

		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
