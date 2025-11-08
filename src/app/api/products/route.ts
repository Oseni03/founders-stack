import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findAvailableSlug, getOrganizations } from "@/server/organizations";
import { generateSlug } from "@/lib/utils";

export async function GET(request: NextRequest) {
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

		// Get all organizations where user is a member
		const organizations = await getOrganizations();

		return NextResponse.json({ products: organizations });
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json(
			{ error: "Failed to fetch products" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
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

		const body = await request.json();
		const { name, slug: providedSlug, logo, description } = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Name is required" },
				{ status: 400 }
			);
		}

		// Generate slug from name if not provided
		let slug = providedSlug;
		if (!slug) {
			slug = generateSlug(name);
		}

		// Verify slug uniqueness and find available slug if needed
		slug = await findAvailableSlug(slug);

		// Create organization using Better Auth API
		const newOrg = await auth.api.createOrganization({
			body: {
				name,
				slug,
				logo,
				description,
			},
			headers: request.headers,
		});

		if (!newOrg) {
			return NextResponse.json(
				{ error: "Failed to create product" },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{
				product: newOrg,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating product:", error);
		return NextResponse.json(
			{ error: "Failed to create product" },
			{ status: 500 }
		);
	}
}
