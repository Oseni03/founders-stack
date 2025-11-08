"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./users";
import { isAdmin } from "./permissions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { slugifyWithCounter } from "@sindresorhus/slugify";
import { createId } from "@paralleldrive/cuid2";
import { FREE_PLAN } from "@/lib/utils";

export async function getOrganizations() {
	const { currentUser } = await getCurrentUser();

	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

	// Get organization IDs for the user
	const members = await prisma.member.findMany({
		where: { userId: currentUser.id },
		select: { organizationId: true },
	});

	const organizationIds = members.map((m) => m.organizationId);

	if (organizationIds.length === 0) {
		return [];
	}

	// Fetch all data in parallel
	const [organizations, invoices, subscriptions, customerCounts] =
		await Promise.all([
			prisma.organization.findMany({
				where: { id: { in: organizationIds } },
				include: {
					members: {
						include: {
							user: true,
						},
					},
					invitations: true,
					subscription: true,
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

	// Create lookup maps
	const customerCountMap = new Map(
		customerCounts.map((c) => [c.organizationId, c._count.id])
	);

	// Group data by organization
	const invoicesByOrg = new Map<string, typeof invoices>();
	const subscriptionsByOrg = new Map<string, typeof subscriptions>();

	invoices.forEach((inv) => {
		if (!invoicesByOrg.has(inv.organizationId)) {
			invoicesByOrg.set(inv.organizationId, []);
		}
		invoicesByOrg.get(inv.organizationId)!.push(inv);
	});

	subscriptions.forEach((sub) => {
		if (!subscriptionsByOrg.has(sub.organizationId)) {
			subscriptionsByOrg.set(sub.organizationId, []);
		}
		subscriptionsByOrg.get(sub.organizationId)!.push(sub);
	});

	// Map organizations with metrics
	const organizationsWithMetrics = organizations.map((org) => {
		const orgInvoices = invoicesByOrg.get(org.id) || [];
		const orgSubscriptions = subscriptionsByOrg.get(org.id) || [];

		// Calculate revenue
		let totalRevenue = 0;
		let revenue30Days = 0;

		for (const inv of orgInvoices) {
			totalRevenue += inv.amountPaid;
			if (inv.issuedDate && inv.issuedDate >= thirtyDaysAgo) {
				revenue30Days += inv.amountPaid;
			}
		}

		// Calculate MRR
		let mrr = 0;
		for (const sub of orgSubscriptions) {
			if (sub.billingCycle === "monthly") {
				mrr += sub.amount;
			} else if (sub.billingCycle === "yearly") {
				mrr += sub.amount / 12;
			}
		}

		return {
			...org,
			revenue30Days: Math.round(revenue30Days),
			totalRevenue: Math.round(totalRevenue),
			activeSubscriptions: orgSubscriptions.length,
			mrr: Math.round(mrr),
			totalCustomers: customerCountMap.get(org.id) || 0,
		};
	});

	return organizationsWithMetrics;
}

export async function getActiveOrganization(userId: string) {
	const memberUser = await prisma.member.findFirst({
		where: {
			userId,
		},
	});

	if (!memberUser) {
		return null;
	}

	const activeOrganization = await prisma.organization.findFirst({
		where: { id: memberUser.organizationId },
		include: {
			members: {
				include: {
					user: true,
				},
			},
			invitations: true,
			subscription: true,
		},
	});

	return { ...activeOrganization, role: memberUser.role };
}

export async function getOrganizationBySlug(slug: string) {
	try {
		const organizationBySlug = await prisma.organization.findUnique({
			where: { slug },
			include: {
				members: {
					include: {
						user: true,
					},
				},
				invitations: true,
			},
		});

		return organizationBySlug;
	} catch (error) {
		console.error(error);
		return null;
	}
}

export async function getOrganizationById(orgId: string) {
	try {
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		// Execute all queries in parallel
		const [organization, invoices, subscriptions, customerCount] =
			await Promise.all([
				prisma.organization.findUnique({
					where: { id: orgId },
					include: {
						members: {
							include: {
								user: true,
							},
						},
						invitations: true,
						subscription: true,
					},
				}),
				prisma.invoice.findMany({
					where: {
						organizationId: orgId,
						status: "paid",
					},
					select: {
						amountPaid: true,
						issuedDate: true,
					},
				}),
				prisma.financeSubscription.findMany({
					where: {
						organizationId: orgId,
						status: { in: ["active", "trialing"] },
					},
					select: {
						amount: true,
						billingCycle: true,
					},
				}),
				prisma.customer.count({
					where: {
						organizationId: orgId,
					},
				}),
			]);

		if (!organization) {
			return {
				data: null,
				success: false,
				error: "Organization not found",
			};
		}

		// Calculate metrics efficiently
		let totalRevenue = 0;
		let revenue30Days = 0;

		for (const invoice of invoices) {
			totalRevenue += invoice.amountPaid;
			if (invoice.issuedDate && invoice.issuedDate >= thirtyDaysAgo) {
				revenue30Days += invoice.amountPaid;
			}
		}

		// Calculate MRR
		let mrr = 0;
		for (const sub of subscriptions) {
			if (sub.billingCycle === "monthly") {
				mrr += sub.amount;
			} else if (sub.billingCycle === "yearly") {
				mrr += sub.amount / 12;
			}
		}

		// Combine organization data with metrics
		const organizationWithMetrics = {
			...organization,
			revenue30Days: Math.round(revenue30Days),
			totalRevenue: Math.round(totalRevenue),
			activeSubscriptions: subscriptions.length,
			mrr: Math.round(mrr),
			totalCustomers: customerCount,
		};

		return { data: organizationWithMetrics, success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error };
	}
}

export async function updateOrganization(
	organizationId: string,
	data: { name: string; description: string }
) {
	try {
		const result = await auth.api.updateOrganization({
			body: {
				data,
				organizationId,
			},
			// This endpoint requires session cookies.
			headers: await headers(),
		});
		return { data: result, success: true };
	} catch (error) {
		console.error("Error updating project: ", error);
		return {
			success: false,
			error: "Failed to upgrade project",
		};
	}
}

export async function deleteOrganization(organizationId: string) {
	try {
		const { success } = await isAdmin();

		if (!success) {
			throw new Error("You are not authorized to remove members.");
		}

		const result = await auth.api.deleteOrganization({
			body: {
				organizationId,
			},
			// This endpoint requires session cookies.
			headers: await headers(),
		});
		return { success: true, data: result };
	} catch (error) {
		console.error(error);
		return { success: false, error };
	}
}

export async function createOrganization(
	userId: string,
	data: { name: string; description: string }
) {
	try {
		// Generate slug from name
		const slugify = slugifyWithCounter();

		// Ensure slug is unique
		let slug = slugify(data.name);
		let isUnique = false;

		while (!isUnique) {
			const existing = await prisma.organization.findUnique({
				where: { slug },
			});

			if (!existing) {
				isUnique = true;
			} else {
				slug = slugify(data.name);
			}
		}

		const freePlan = FREE_PLAN;
		if (!freePlan)
			throw new Error("Free plan not found in subscription plans");

		const now = new Date();
		const currentPeriodEnd = new Date();
		currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

		// Direct database creation bypassing auth API
		const organization = await prisma.organization.create({
			data: {
				name: data.name,
				slug,
				description: data.description,
				createdAt: new Date(),
				members: {
					create: {
						userId: userId,
						role: "admin",
					},
				},
				subscription: {
					create: {
						status: "active",
						amount: 0,
						currency: "USD",
						recurringInterval: "yearly",
						currentPeriodStart: now,
						currentPeriodEnd,
						cancelAtPeriodEnd: false,
						startedAt: now,
						customerId: createId(),
						productId: freePlan.productId,
						checkoutId: `free_${createId()}`,
						createdAt: now,
					},
				},
			},
			include: {
				members: true,
				subscription: true,
			},
		});

		return { data: organization, success: true };
	} catch (error) {
		console.error("Error creating project: ", error);
		return { success: false, error };
	}
}

export async function setActiveOrganization(organizationId: string) {
	try {
		const result = await auth.api.setActiveOrganization({
			body: {
				organizationId,
			},
			// This endpoint requires session cookies.
			headers: await headers(),
		});
		console.log("Set active project result:", result);
		return { data: result, success: true };
	} catch (error) {
		console.error("Error creating project: ", error);
		return { success: false, error };
	}
}

export async function findAvailableSlug(baseSlug: string): Promise<string> {
	let slug = baseSlug;
	let counter = 1;

	while (true) {
		const existingOrg = await prisma.organization.findUnique({
			where: { slug },
		});

		if (!existingOrg) {
			return slug;
		}

		// Slug exists, try with counter
		slug = `${baseSlug}-${counter}`;
		counter++;

		// Safety limit to prevent infinite loops
		if (counter > 100) {
			throw new Error("Could not generate unique slug");
		}
	}
}

export async function getProductStats() {
	// Fetch organizations with related counts we care about
	const organizations = await prisma.organization.findMany({
		include: {
			financeSubscriptions: {
				where: {
					status: { in: ["active", "trialing"] },
				},
				select: {
					amount: true,
					billingCycle: true,
					startDate: true,
				},
			},
			projects: { select: { id: true } },
			integrations: { select: { id: true } },
			members: { select: { id: true } },
			repositories: { select: { id: true } },
		},
		orderBy: { createdAt: "desc" },
	});

	const now = new Date();
	const thirtyDaysAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

	let totalRevenue = 0;
	let last30DaysRevenue = 0;
	let totalMRR = 0;

	for (const org of organizations) {
		const subscriptions = org.financeSubscriptions;

		for (const sub of subscriptions) {
			if (sub.amount && typeof sub.amount === "number") {
				totalRevenue += sub.amount;

				const createdAt = sub.startDate
					? new Date(sub.startDate)
					: null;
				if (createdAt && createdAt >= thirtyDaysAgo) {
					last30DaysRevenue += sub.amount;
				}

				const interval = (sub.billingCycle || "").toLowerCase();
				if (
					interval.includes("month") ||
					interval.includes("monthly")
				) {
					totalMRR += sub.amount;
				} else if (
					interval.includes("year") ||
					interval.includes("yearly")
				) {
					totalMRR += sub.amount / 12;
				}
			}
		}
	}

	return {
		organizations,
		totalRevenue: Math.round(totalRevenue),
		last30DaysRevenue: Math.round(last30DaysRevenue),
		totalMRR: Math.round(totalMRR),
		totalStartups: organizations.length,
	};
}
