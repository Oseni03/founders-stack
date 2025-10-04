"use server";

import { auth } from "@/lib/auth";
import { getIntegrationCategory } from "@/lib/oauth-utils";
import { prisma } from "@/lib/prisma";
import { IntegrationStatus } from "@prisma/client";
import { Account } from "better-auth";
import { headers } from "next/headers";

export async function getIntegrationTokens(userId: string, provider: string) {
	const account = await prisma.account.findFirst({
		where: { userId, providerId: provider },
	});

	if (!account?.accessToken) {
		throw new Error("Integration not connected");
	}

	return {
		accessToken: account.accessToken,
		refreshToken: account.refreshToken,
	};
}

export async function createIntegration(account: Account) {
	const category = getIntegrationCategory(account.providerId);
	const activeOrg = await auth.api.getFullOrganization({
		headers: await headers(),
	});
	if (!activeOrg) return;
	const integration = await prisma.integration.upsert({
		where: {
			type: account.providerId,
			organizationId: activeOrg.id,
			accountId: account.id,
		},
		create: {
			category,
			status: IntegrationStatus.active,
			type: account.providerId,
			organizationId: activeOrg.id,
			userId: account.userId,
			accountId: account.id,
		},
		update: {
			status: IntegrationStatus.active,
		},
	});
	return integration;
}

export async function getIntegration(organizationId: string, type: string) {
	const integration = await prisma.integration.findFirst({
		where: {
			organizationId,
			type,
		},
	});
	return integration;
}
