"use server";

import { prisma } from "@/lib/prisma";
import {
	IntegrationCategory,
	IntegrationStatus,
	IntegrationType,
} from "@prisma/client";

export async function getIntegrationTokens(
	organizationId: string,
	provider: string
) {
	const integration = await prisma.integration.findFirst({
		where: { organizationId, toolName: provider },
	});

	if (!integration?.accessToken) {
		throw new Error("Integration not connected");
	}

	return {
		accessToken: integration.accessToken,
		refreshToken: integration.refreshToken,
	};
}

export async function deleteIntegration(
	organizationId: string,
	toolName: string
) {
	await prisma.integration.deleteMany({
		where: { organizationId, toolName },
	});
}

export async function getIntegration(organizationId: string, toolName: string) {
	const integration = await prisma.integration.findFirst({
		where: {
			organizationId,
			toolName,
		},
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

export async function createAPIIntegration(
	organizationId: string,
	data: {
		toolName: string;
		apiKey: string;
		category: IntegrationCategory;
		status: IntegrationStatus;
	}
) {
	// Then create/update the integration with the account reference
	const integration = await prisma.integration.upsert({
		where: {
			organizationId_toolName: {
				organizationId,
				toolName: data.toolName,
			},
		},
		update: {
			...data,
			type: IntegrationType.api_key,
		},
		create: {
			...data,
			type: IntegrationType.api_key,
			organizationId,
		},
	});

	return integration;
}
