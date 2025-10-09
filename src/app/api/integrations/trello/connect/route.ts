import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import {
	createIntegrationAccount,
	createOAuthTemp,
} from "@/server/integrations";
import { createId } from "@paralleldrive/cuid2";
import { IntegrationType } from "@prisma/client";

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

// Step 1: Initiate (GET /api/trello/auth)
export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			const requestData = {
				url: "https://trello.com/1/OAuthRequestToken/",
				method: "POST",
			};
			const token = oauth.authorize(requestData); // Generates signed request

			const authHeader = oauth.toHeader(token).Authorization;

			const response = await fetch(requestData.url, {
				method: "POST",
				headers: {
					Authorization: authHeader,
				},
			});

			if (!response.ok) {
				throw new Error(
					`Request failed with status ${response.status}`
				);
			}

			const text = await response.text();
			const params = Object.fromEntries(new URLSearchParams(text));
			const { oauth_token, oauth_token_secret } = params;

			if (!oauth_token || !oauth_token_secret) {
				throw new Error("Missing oauth_token or oauth_token_secret");
			}

			await createOAuthTemp(
				user.id,
				"trello",
				oauth_token,
				oauth_token_secret
			);

			// Create a pending Integration record
			await createIntegrationAccount(user.organizationId, user.id, {
				toolName: "trello",
				type: IntegrationType.oauth1a,
				accountId: createId(),
				providerId: "trello",
				category: "project_management",
				status: "pending",
			});

			const authUrl = `https://trello.com/1/authorize?oauth_token=${oauth_token}&name=Founder&scope=read,write&expiration=never&return_url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}/api/trello/callback`)}`;
			return NextResponse.json({ url: authUrl });
		} catch (error) {
			console.error(`Failed to connect Trello`, error);
			return NextResponse.json(
				{ error: `Failed to fetch conect Trello` },
				{ status: 500 }
			);
		}
	});
}
