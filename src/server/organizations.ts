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
	const [organizations, taskCounts, integrationCounts] = await Promise.all([
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
		prisma.task.groupBy({
			by: ["organizationId"],
			where: {
				organizationId: { in: organizationIds },
				status: { not: "done" }, // Assuming "DONE" indicates completed tasks
			},
			_count: { id: true },
		}),
		prisma.integration.groupBy({
			by: ["organizationId"],
			where: { organizationId: { in: organizationIds } },
			_count: { id: true },
		}),
	]);

	// Create lookup maps for counts
	const taskCountMap = new Map(
		taskCounts.map((t) => [t.organizationId, t._count.id])
	);
	const integrationCountMap = new Map(
		integrationCounts.map((i) => [i.organizationId, i._count.id])
	);

	// Map organizations with metrics
	const organizationsWithMetrics = organizations.map((org) => ({
		...org,
		activeTasks: taskCountMap.get(org.id) || 0,
		toolCount: integrationCountMap.get(org.id) || 0,
	}));

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
		// Execute all queries in parallel
		const [organization, taskCount, integrationCount] = await Promise.all([
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
			prisma.task.count({
				where: {
					organizationId: orgId,
					status: { not: "done" }, // Assuming "DONE" indicates completed tasks
				},
			}),
			prisma.integration.count({
				where: { organizationId: orgId },
			}),
		]);

		if (!organization) {
			return {
				data: null,
				success: false,
				error: "Organization not found",
			};
		}

		// Combine organization data with metrics
		const organizationWithMetrics = {
			...organization,
			activeTasks: taskCount,
			toolCount: integrationCount,
		};

		return { data: organizationWithMetrics, success: true };
	} catch (error) {
		console.error(error);
		return { success: false, error };
	}
}

export async function updateOrganization(
	organizationId: string,
	data: { name: string; description: string; logo?: string }
) {
	try {
		const result = await auth.api.updateOrganization({
			body: {
				data,
				organizationId,
			},
			headers: await headers(),
		});

		// Fetch updated counts to ensure Organization interface compliance
		const [taskCount, integrationCount] = await Promise.all([
			prisma.task.count({
				where: {
					organizationId,
					status: { not: "done" },
				},
			}),
			prisma.integration.count({
				where: { organizationId },
			}),
		]);

		return {
			data: {
				...result,
				activeTasks: taskCount,
				toolCount: integrationCount,
			},
			success: true,
		};
	} catch (error) {
		console.error("Error updating organization: ", error);
		return {
			success: false,
			error: "Failed to update organization",
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
						role: "ADMIN",
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
