/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { IntegrationCategory } from "@prisma/client";

export interface OAuthConfig {
	clientId: string;
	clientSecret: string;
	authorizationUrl: string;
	tokenUrl: string;
	scopes: string[];
	redirectUri: string;
}

export class OAuthHandler {
	constructor(
		private platform: string,
		private config: OAuthConfig
	) {}

	// Step 1: Generate authorization URL
	generateAuthUrl(state: string, organizationId: string): string {
		const params = new URLSearchParams({
			client_id: this.config.clientId,
			redirect_uri: this.config.redirectUri,
			scope: this.config.scopes.join(" "),
			state: `${state}:${organizationId}`, // Encode workspace in state
			response_type: "code",
			access_type: "offline", // For refresh tokens
		});

		return `${this.config.authorizationUrl}?${params.toString()}`;
	}

	// Step 2: Exchange code for tokens
	async exchangeCodeForTokens(code: string): Promise<{
		accessToken: string;
		refreshToken?: string;
		expiresIn?: number;
	}> {
		const response = await fetch(this.config.tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				client_id: this.config.clientId,
				client_secret: this.config.clientSecret,
				code,
				redirect_uri: this.config.redirectUri,
				grant_type: "authorization_code",
			}),
		});

		if (!response.ok) {
			throw new Error(`Token exchange failed: ${response.statusText}`);
		}

		const data = await response.json();

		return {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresIn: data.expires_in,
		};
	}

	// Step 3: Refresh access token
	async refreshAccessToken(refreshToken: string): Promise<{
		accessToken: string;
		refreshToken?: string;
		expiresIn?: number;
	}> {
		const response = await fetch(this.config.tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				client_id: this.config.clientId,
				client_secret: this.config.clientSecret,
				refresh_token: refreshToken,
				grant_type: "refresh_token",
			}),
		});

		if (!response.ok) {
			throw new Error(`Token refresh failed: ${response.statusText}`);
		}

		const data = await response.json();

		return {
			accessToken: data.access_token,
			refreshToken: data.refresh_token || refreshToken,
			expiresIn: data.expires_in,
		};
	}

	// Save integration to database
	async saveIntegration({
		organizationId,
		userId,
		accessToken,
		refreshToken,
		expiresIn,
		metadata,
	}: {
		organizationId: string;
		userId: string;
		accessToken: string;
		refreshToken?: string;
		expiresIn?: number;
		metadata: Record<string, any>;
	}) {
		const expiresAt = expiresIn
			? new Date(Date.now() + expiresIn * 1000)
			: null;

		return await prisma.integration.upsert({
			where: {
				organizationId_platform: {
					organizationId,
					platform: this.platform,
				},
			},
			update: {
				accessToken: accessToken,
				refreshToken: refreshToken,
				tokenExpiresAt: expiresAt,
				status: "CONNECTED",
				metadata,
			},
			create: {
				organizationId,
				platform: this.platform,
				category: this.getCategoryForPlatform(),
				accessToken: accessToken,
				refreshToken: refreshToken,
				tokenExpiresAt: expiresAt,
				status: "CONNECTED",
				metadata,
				userId,
			},
		});
	}

	private getCategoryForPlatform(): IntegrationCategory {
		const categories: Record<string, IntegrationCategory> = {
			JIRA: "PROJECT_TRACKING",
			SLACK: "COMMUNICATION",
			FIGMA: "DESIGN",
			GITHUB: "CODE",
			GOOGLE_ANALYTICS: "ANALYTICS",
		};
		return categories[this.platform] || "OTHER";
	}
}
