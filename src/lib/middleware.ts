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
	) => Promise<NextResponse>,
	organizationId?: string | null
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized - Please login" },
				{ status: 401 }
			);
		}

		let resolvedOrgId: string | null = organizationId || null;

		// If organizationId not provided as parameter, try to extract from request
		if (!resolvedOrgId) {
			// Try to get from URL params first (e.g., /api/products/[productId]/...)
			const urlParts = request.nextUrl.pathname.split("/");
			const orgIndex = urlParts.findIndex(
				(part) => part === "products" || part === "organizations"
			);
			if (orgIndex !== -1 && urlParts[orgIndex + 1]) {
				resolvedOrgId = urlParts[orgIndex + 1];
			}

			// If not in URL, try to get from query params
			if (!resolvedOrgId) {
				resolvedOrgId = request.nextUrl.searchParams.get("productId");
			}

			// If not in query params, try to get from request body
			if (
				!resolvedOrgId &&
				(request.method === "POST" ||
					request.method === "PUT" ||
					request.method === "PATCH")
			) {
				try {
					const body = await request.clone().json();
					resolvedOrgId = body.organizationId;
				} catch {
					// Body parsing failed or no body
				}
			}
		}

		// If organizationId is provided, fetch that specific organization
		// Otherwise, get the active organization
		let activeOrg;

		if (resolvedOrgId) {
			// Fetch specific organization by ID
			activeOrg = await auth.api.getFullOrganization({
				headers: request.headers,
				query: {
					organizationId: resolvedOrgId,
				},
			});

			if (!activeOrg) {
				return NextResponse.json(
					{ error: "Project not found" },
					{ status: 404 }
				);
			}
		} else {
			// Get active organization from session
			activeOrg = await auth.api.getFullOrganization({
				headers: request.headers,
			});

			if (!activeOrg) {
				return NextResponse.json(
					{ error: "No active project found" },
					{ status: 404 }
				);
			}

			// Set organizationId from active org if available
			if (activeOrg) {
				resolvedOrgId = activeOrg.id;
			}
		}

		// If organization exists, verify membership
		let userRole: string | undefined;

		if (activeOrg) {
			const member = activeOrg.members.find(
				(member) => member.userId === session.user.id
			);

			if (!member) {
				return NextResponse.json(
					{ error: "Forbidden - Not a member of this organization" },
					{ status: 403 }
				);
			}

			userRole = member.role;
		}

		const userContext: AuthUser = {
			...session.user,
			organizationId: resolvedOrgId!,
			role: userRole,
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
		user: AuthUser,
		session: Session
	) => Promise<NextResponse>,
	organizationId?: string | null
) {
	return withAuth(
		request,
		async (request, user, session) => {
			if (user.role !== "admin" && user.role !== "owner") {
				return NextResponse.json(
					{ error: "Forbidden - Admin access required" },
					{ status: 403 }
				);
			}
			return await handler(request, user, session);
		},
		organizationId
	);
}

export async function withOwnerAuth(
	request: NextRequest,
	handler: (
		request: NextRequest,
		user: AuthUser,
		session: Session
	) => Promise<NextResponse>,
	organizationId?: string | null
) {
	return withAuth(
		request,
		async (request, user, session) => {
			if (user.role !== "owner") {
				return NextResponse.json(
					{ error: "Forbidden - Owner access required" },
					{ status: 403 }
				);
			}
			return await handler(request, user, session);
		},
		organizationId
	);
}
