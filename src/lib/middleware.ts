import { type NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";
import { Session, User } from "better-auth";

export interface AuthUser extends User {
	role?: string;
	organizationId: string;
}

export async function withAuth(
	request: NextRequest,
	handler: (
		request: NextRequest,
		user: AuthUser,
		session: Session
	) => Promise<NextResponse>
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		const activeOrg = await auth.api.getFullOrganization({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized - Please login" },
				{ status: 401 }
			);
		}

		// Get active organization from session or default to first membership
		const activeOrgId = session.activeOrganizationId || activeOrg?.id;

		if (!activeOrgId) {
			return NextResponse.json(
				{ error: "Unauthorized - No active organization" },
				{ status: 401 }
			);
		}

		const isAdmin = !!activeOrg?.members?.find(
			(member) =>
				member.userId == session?.user?.id && member.role == "admin"
		);

		const userContext = {
			...session.user,
			organizationId: activeOrgId,
			role: isAdmin ? "admin" : "member",
		};

		return await handler(request, userContext, session.session);
	} catch (error) {
		console.error("Auth middleware error:", error);
		return NextResponse.json(
			{ error: "Authentication failed" },
			{ status: 401 }
		);
	}
}

export async function withAdminAuth(
	request: NextRequest,
	handler: (
		request: NextRequest,
		user: User,
		session: Session
	) => Promise<NextResponse>
) {
	return withAuth(request, async (request, user, session) => {
		if (user.role !== "admin") {
			return NextResponse.json(
				{ error: "Forbidden - Admin access required" },
				{ status: 403 }
			);
		}
		return await handler(request, user, session);
	});
}

// export async function withProSubscription(
// 	request: NextRequest,
// 	handler: (
// 		request: NextRequest,
// 		user: User,
// 		session: Session
// 	) => Promise<NextResponse>
// ) {
// 	return withAuth(request, async (request, user, session) => {
// 		if (user.subscription !== "pro") {
// 			return NextResponse.json(
// 				{ error: "Pro subscription required" },
// 				{ status: 403 }
// 			);
// 		}
// 		return await handler(request, user, session);
// 	});
// }
