import { prisma } from "@/lib/prisma";

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
