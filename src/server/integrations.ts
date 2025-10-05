"use server";

import { auth } from "@/lib/auth";
import { getIntegrationCategory } from "@/lib/oauth-utils";
import { prisma } from "@/lib/prisma";
import { IntegrationStatus, IntegrationType } from "@prisma/client";
import { Account } from "better-auth";
import { headers } from "next/headers";

export async function getIntegrationTokens(
	organizationId: string,
	provider: string
) {
	const integration = await prisma.integration.findFirst({
		where: { organizationId, toolName: provider },
		include: { account: true },
	});

	if (!integration?.account?.accessToken) {
		throw new Error("Integration not connected");
	}

	return {
		accessToken: integration.account.accessToken,
		refreshToken: integration.account.refreshToken,
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
			toolName: account.providerId,
			organizationId: activeOrg.id,
			accountId: account.id,
		},
		create: {
			toolName: account.providerId,
			category,
			status: IntegrationStatus.active,
			type: IntegrationType.oauth,
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

export async function getIntegration(organizationId: string, toolName: string) {
	const integration = await prisma.integration.findFirst({
		where: {
			organizationId,
			toolName,
		},
		include: { account: true },
	});
	return integration;
}

export async function getIntegrations(organizationId: string) {
	const integration = await prisma.integration.findFirst({
		where: {
			organizationId,
		},
	});
	return integration;
}
