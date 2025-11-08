// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findAvailableSlug } from "@/server/organizations";
import { generateSlug } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

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

		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		// Get all organization IDs for the user first (lightweight query)
		const userMemberships = await prisma.member.findMany({
			where: { userId: session.user.id },
			select: { organizationId: true },
		});

		const organizationIds = userMemberships.map((m) => m.organizationId);

		if (organizationIds.length === 0) {
			return NextResponse.json({
				stats: {
					totalRevenue: 0,
					revenue30Days: 0,
					totalMRR: 0,
					totalOrganizations: 0,
					totalCustomers: 0,
				},
				products: [],
			});
		}

		// Execute all queries in parallel
		const [organizations, invoices, subscriptions, customerCount] =
			await Promise.all([
				prisma.organization.findMany({
					where: { id: { in: organizationIds } },
					select: {
						id: true,
						name: true,
						logo: true,
						description: true,
					},
				}),
				prisma.invoice.findMany({
					where: {
						organizationId: { in: organizationIds },
						status: "paid",
					},
					select: {
						amountPaid: true,
						issuedDate: true,
						organizationId: true,
					},
				}),
				prisma.financeSubscription.findMany({
					where: {
						organizationId: { in: organizationIds },
						status: { in: ["active", "trialing"] },
					},
					select: {
						amount: true,
						billingCycle: true,
						organizationId: true,
					},
				}),
				prisma.customer.groupBy({
					by: ["organizationId"],
					where: { organizationId: { in: organizationIds } },
					_count: { id: true },
				}),
			]);

		// Create lookup maps for O(1) access
		const customerCountMap = new Map(
			customerCount.map((c) => [c.organizationId, c._count.id])
		);
		const subscriptionsByOrg = new Map<string, typeof subscriptions>();
		const invoicesByOrg = new Map<string, typeof invoices>();

		// Group subscriptions and invoices by organization
		subscriptions.forEach((sub) => {
			if (!subscriptionsByOrg.has(sub.organizationId)) {
				subscriptionsByOrg.set(sub.organizationId, []);
			}
			subscriptionsByOrg.get(sub.organizationId)!.push(sub);
		});

		invoices.forEach((inv) => {
			if (!invoicesByOrg.has(inv.organizationId)) {
				invoicesByOrg.set(inv.organizationId, []);
			}
			invoicesByOrg.get(inv.organizationId)!.push(inv);
		});

		// Calculate metrics for each organization
		let totalRevenue = 0;
		let revenue30Days = 0;
		let totalMRR = 0;
		const totalCustomers = customerCount.reduce(
			(sum, c) => sum + c._count.id,
			0
		);

		const products = organizations.map((org) => {
			const orgInvoices = invoicesByOrg.get(org.id) || [];
			const orgSubscriptions = subscriptionsByOrg.get(org.id) || [];

			// Calculate revenue for this organization
			let orgTotalRevenue = 0;
			let orgRevenue30Days = 0;

			for (const inv of orgInvoices) {
				orgTotalRevenue += inv.amountPaid;
				totalRevenue += inv.amountPaid;

				if (inv.issuedDate && inv.issuedDate >= thirtyDaysAgo) {
					orgRevenue30Days += inv.amountPaid;
					revenue30Days += inv.amountPaid;
				}
			}

			// Calculate MRR for this organization
			let mrr = 0;
			for (const sub of orgSubscriptions) {
				if (sub.billingCycle === "monthly") {
					mrr += sub.amount;
				} else if (sub.billingCycle === "yearly") {
					mrr += sub.amount / 12;
				}
			}
			totalMRR += mrr;

			return {
				id: org.id,
				name: org.name,
				description: org.description,
				logo: org.logo,
				revenue30Days: Math.round(orgRevenue30Days),
				totalRevenue: Math.round(orgTotalRevenue),
				activeSubscriptions: orgSubscriptions.length,
				mrr: Math.round(mrr),
				totalCustomers: customerCountMap.get(org.id) || 0,
			};
		});

		// Sort by total revenue (descending)
		products.sort((a, b) => b.totalRevenue - a.totalRevenue);

		const stats = {
			totalRevenue: Math.round(totalRevenue),
			revenue30Days: Math.round(revenue30Days),
			totalMRR: Math.round(totalMRR),
			totalOrganizations: products.length,
			totalCustomers,
		};

		return NextResponse.json({ stats, products });
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

		if (!name || !name.trim()) {
			return NextResponse.json(
				{ error: "Name is required" },
				{ status: 400 }
			);
		}

		// Generate and verify slug in parallel if needed
		let slug = providedSlug?.trim() || generateSlug(name);
		slug = await findAvailableSlug(slug);

		// Create organization using Better Auth API
		const newOrg = await auth.api.createOrganization({
			body: {
				name: name.trim(),
				slug,
				logo: logo?.trim() || null,
				description: description?.trim() || null,
			},
			headers: request.headers,
		});

		if (!newOrg) {
			return NextResponse.json(
				{ error: "Failed to create product" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ product: newOrg }, { status: 201 });
	} catch (error) {
		console.error("Error creating product:", error);
		return NextResponse.json(
			{ error: "Failed to create product" },
			{ status: 500 }
		);
	}
}
