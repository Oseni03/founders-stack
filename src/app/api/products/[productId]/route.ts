import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	try {
		const { productId } = await params;

		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized - Please login" },
				{ status: 401 }
			);
		}

		// Get organization with member check
		const organization = await prisma.organization.findUnique({
			where: { id: productId },
			include: {
				members: {
					where: {
						userId: session.user.id,
					},
				},
				// _count: {
				// 	select: {
				// 		members: true,
				// 		repositories: true,
				// 	},
				// },
			},
		});

		if (!organization) {
			return NextResponse.json(
				{ error: "Product not found" },
				{ status: 404 }
			);
		}

		// Check if user is a member
		if (organization.members.length === 0) {
			return NextResponse.json(
				{ error: "Forbidden - Not a member of this product" },
				{ status: 403 }
			);
		}

		return NextResponse.json({ product: organization });
	} catch (error) {
		console.error("Error fetching product:", error);
		return NextResponse.json(
			{ error: "Failed to fetch product" },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	try {
		const { productId } = await params;

		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized - Please login" },
				{ status: 401 }
			);
		}

		// Get organization and check membership
		const organization = await prisma.organization.findUnique({
			where: { id: productId },
			include: {
				members: {
					where: {
						userId: session.user.id,
					},
				},
			},
		});

		if (!organization) {
			return NextResponse.json(
				{ error: "Product not found" },
				{ status: 404 }
			);
		}

		if (organization.members.length === 0) {
			return NextResponse.json(
				{ error: "Forbidden - Not a member of this product" },
				{ status: 403 }
			);
		}

		// Only owners and admins can update
		const userRole = organization.members?.find(
			(org) => org.userId === session.user?.id
		)?.role;
		if (userRole !== "owner" && userRole !== "admin") {
			return NextResponse.json(
				{ error: "Forbidden - Insufficient permissions" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { name, slug, logo, description } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Product name is missing" },
				{ status: 409 }
			);
		}

		// If slug is being changed, check if it's available
		if (slug && slug !== organization.slug) {
			const existingOrg = await prisma.organization.findUnique({
				where: { slug },
			});

			if (existingOrg) {
				return NextResponse.json(
					{ error: "Product with this slug already exists" },
					{ status: 409 }
				);
			}
		}

		// Update organization using Better Auth API
		const updatedOrg = await prisma.organization.update({
			where: { id: productId },
			data: {
				name,
				description,
				slug,
				logo,
			},
		});

		if (!updatedOrg) {
			return NextResponse.json(
				{ error: "Failed to update product" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			product: organization,
		});
	} catch (error) {
		console.error("Error updating product:", error);
		return NextResponse.json(
			{ error: "Failed to update product" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ productId: string }> }
) {
	try {
		const { productId } = await params;

		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized - Please login" },
				{ status: 401 }
			);
		}

		// Get organization and check membership
		const organization = await prisma.organization.findUnique({
			where: { id: productId },
			include: {
				members: {
					where: {
						userId: session.user.id,
					},
				},
			},
		});

		if (!organization) {
			return NextResponse.json(
				{ error: "Product not found" },
				{ status: 404 }
			);
		}

		if (organization.members.length === 0) {
			return NextResponse.json(
				{ error: "Forbidden - Not a member of this product" },
				{ status: 403 }
			);
		}

		// Only owners can delete
		const userRole = organization.members?.find(
			(org) => org.userId === session.user?.id
		)?.role;
		if (userRole !== "owner") {
			return NextResponse.json(
				{ error: "Forbidden - Only owners can delete products" },
				{ status: 403 }
			);
		}

		// Delete organization using Better Auth API
		await auth.api.deleteOrganization({
			body: {
				organizationId: productId,
			},
			headers: request.headers,
		});

		return NextResponse.json(
			{ message: "Product deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error deleting product:", error);
		return NextResponse.json(
			{ error: "Failed to delete product" },
			{ status: 500 }
		);
	}
}
