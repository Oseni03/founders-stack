import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { withAuth } from "@/lib/middleware";
import OAuth from "oauth-1.0a";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { getOAuthTemp } from "@/server/integrations";

const oauth = new OAuth({
	consumer: {
		key: process.env.TRELLO_API_KEY!,
		secret: process.env.TRELLO_API_SECRET!,
	},
	signature_method: "HMAC-SHA1",
	hash_function(base_string, key) {
		return crypto
			.createHmac("sha1", key)
			.update(base_string)
			.digest("base64");
	},
});

export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		const { searchParams } = new URL(request.url);
		const oauth_token = searchParams.get("oauth_token");
		const oauth_verifier = searchParams.get("oauth_verifier");

		if (!oauth_token || !oauth_verifier) {
			return NextResponse.json(
				{ error: "Invalid session or token" },
				{ status: 400 }
			);
		}

		// Retrieve temporary credentials from OAuthTemp
		const tempCredentials = await getOAuthTemp(
			user.id,
			"trello",
			oauth_token
		);

		if (!tempCredentials || tempCredentials.expiresAt < new Date()) {
			return NextResponse.json(
				{ error: "Invalid or expired OAuth token" },
				{ status: 400 }
			);
		}

		const requestData = {
			url: "https://trello.com/1/OAuthAccessToken/",
			method: "POST",
		};
		const token = {
			key: oauth_token,
			secret: tempCredentials.oauthTokenSecret,
		};

		try {
			const authHeader = oauth.toHeader(
				oauth.authorize(requestData, token)
			).Authorization;
			const response = await fetch(requestData.url, {
				method: "POST",
				headers: { Authorization: authHeader },
				body: new URLSearchParams({ oauth_verifier: oauth_verifier! }),
			});

			if (!response.ok) {
				throw new Error(
					`Access token request failed with status ${response.status}`
				);
			}

			const text = await response.text();
			const params = Object.fromEntries(new URLSearchParams(text));
			const accessToken = params.oauth_token;

			if (!accessToken) {
				throw new Error("Missing access token");
			}

			// Start a transaction to update Account and Integration
			await prisma.$transaction([
				// Update or create Account record for Trello
				prisma.account.upsert({
					where: {
						userId_providerId: {
							userId: user.id,
							providerId: "trello",
						},
					},
					update: {
						accessToken,
						scope: "read,write",
						updatedAt: new Date(),
					},
					create: {
						id: createId(),
						accountId: createId(), // Generate unique accountId
						providerId: "trello",
						userId: user.id,
						accessToken,
						scope: "read,write",
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				}),
				// Update Integration to mark as active
				prisma.integration.updateMany({
					where: {
						organizationId: user.organizationId,
						toolName: "trello",
						status: "pending",
					},
					data: {
						status: "active",
						lastSyncAt: new Date(),
						lastSyncStatus: "success",
						updatedAt: new Date(),
					},
				}),
				// Clean up OAuthTemp
				prisma.oAuthTemp.deleteMany({
					where: {
						userId: user.id,
						provider: "trello",
						oauthToken: oauth_token,
					},
				}),
			]);

			return NextResponse.redirect("/dashboard/tasks"); // Adjust to your app’s dashboard
		} catch (error) {
			console.error("Callback error:", error);
			await prisma.integration.updateMany({
				where: {
					userId: user.id,
					toolName: "trello",
					status: "pending",
				},
				data: {
					status: "error",
					lastSyncStatus: String(error),
					updatedAt: new Date(),
				},
			});
			return NextResponse.json(
				{ error: "Failed to complete OAuth" },
				{ status: 500 }
			);
		}
	});
}
