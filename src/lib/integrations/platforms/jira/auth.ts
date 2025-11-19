import { OAuthHandler, OAuthConfig } from "../../core/oauth-handler";

export class JiraOAuth extends OAuthHandler {
	constructor() {
		const config: OAuthConfig = {
			clientId: process.env.JIRA_CLIENT_ID!,
			clientSecret: process.env.JIRA_CLIENT_SECRET!,
			authorizationUrl: "https://auth.atlassian.com/authorize",
			tokenUrl: "https://auth.atlassian.com/oauth/token",
			scopes: [
				"read:jira-work",
				"write:jira-work",
				"read:jira-user",
				"offline_access",
			],
			redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`,
		};

		super("JIRA", config);
	}

	// Get Jira cloud ID after OAuth
	async getCloudId(accessToken: string): Promise<string> {
		const response = await fetch(
			"https://api.atlassian.com/oauth/token/accessible-resources",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/json",
				},
			}
		);

		if (!response.ok) {
			throw new Error("Failed to fetch Jira cloud ID");
		}

		const resources = await response.json();

		if (resources.length === 0) {
			throw new Error("No Jira sites found");
		}

		// Return first site (or let user choose if multiple)
		return resources[0].id;
	}

	async connect(code: string, organizationId: string, userId: string) {
		// Exchange code for tokens
		const { accessToken, refreshToken, expiresIn } =
			await this.exchangeCodeForTokens(code);

		// Get Jira cloud ID
		const cloudId = await this.getCloudId(accessToken);

		// Save to database
		return await this.saveIntegration({
			organizationId,
			userId,
			accessToken,
			refreshToken,
			expiresIn,
			metadata: {
				cloudId,
			},
		});
	}
}
