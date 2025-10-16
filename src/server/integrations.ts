"use server";

import { auth } from "@/lib/auth";
import { getIntegrationCategory } from "@/lib/oauth-utils";
import { prisma } from "@/lib/prisma";
import {
	IntegrationCategory,
	IntegrationStatus,
	IntegrationType,
} from "@prisma/client";
import { Account } from "better-auth";
import { headers } from "next/headers";
import { createId } from "@paralleldrive/cuid2";

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
			type: IntegrationType.oauth2,
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
	const integrations = await prisma.integration.findMany({
		where: {
			organizationId,
		},
	});
	return integrations;
}

export async function createOAuthTemp(
	userId: string,
	provider: string,
	oauthToken: string,
	oauthTokenSecret: string
) {
	return await prisma.oAuthTemp.create({
		data: {
			userId,
			provider,
			oauthToken,
			oauthTokenSecret,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10-minute ex
		},
	});
}

export async function getOAuthTemp(
	userId: string,
	provider: string,
	oauthToken: string
) {
	const temp = await prisma.oAuthTemp.findFirst({
		where: {
			userId,
			provider,
			oauthToken,
		},
	});
	return temp;
}

export async function createIntegrationAccount(
	organizationId: string,
	userId: string,
	data: {
		toolName: string;
		type: IntegrationType;
		accountId: string;
		providerId: string;
		category: IntegrationCategory;
		status: IntegrationStatus;
	}
) {
	const account = await prisma.account.create({
		data: {
			id: createId(),
			accountId: data.accountId,
			providerId: data.providerId,
			userId,
		},
	});
	const integration = await prisma.integration.create({
		data: {
			category: data.category,
			status: data.status,
			toolName: data.toolName,
			type: data.type,
			organizationId: organizationId,
			accountId: account.id,
		},
	});
	return integration;
}

export async function createAPIIntegration(
	organizationId: string,
	userId: string,
	data: {
		toolName: string;
		providerId: string;
		apiKey: string;
		category: IntegrationCategory;
		status: IntegrationStatus;
	}
) {
	// First, ensure the account exists
	const account = await prisma.account.upsert({
		where: {
			userId_providerId: {
				userId,
				providerId: data.providerId,
			},
		},
		update: {
			apiKey: data.apiKey,
		},
		create: {
			id: createId(),
			accountId: createId(),
			providerId: data.providerId,
			userId,
			apiKey: data.apiKey,
		},
	});

	// Then create/update the integration with the account reference
	const integration = await prisma.integration.upsert({
		where: {
			organizationId_toolName: {
				organizationId,
				toolName: data.toolName,
			},
		},
		update: {
			category: data.category,
			status: data.status,
			type: IntegrationType.api_key,
			accountId: account.id,
		},
		create: {
			category: data.category,
			status: "active",
			toolName: data.toolName,
			type: IntegrationType.api_key,
			organizationId,
			accountId: account.id,
		},
	});

	return integration;
}
