import { IntegrationCategory, IntegrationStatus } from "@prisma/client";

export const OAuthProviders = [
	{
		providerId: "slack",
		clientId: process.env.SLACK_CLIENT_ID!,
		clientSecret: process.env.SLACK_CLIENT_SECRET!,
		authorizationUrl: "https://slack.com/oauth/v2/authorize",
		tokenUrl: "https://slack.com/api/oauth.v2.access",
		userInfoUrl: "https://slack.com/api/users.info",
		scopes: [
			"chat:write",
			"channels:history",
			"channels:read",
			"groups:history",
			"im:history",
			"identity.basic",
			"reactions:write",
			"files:read",
			"users:read",
			"team:read",
			"groups:read",
		],
		redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth2/callback/slack`,
	},
	{
		providerId: "github",
		clientId: process.env.GITHUB_CLIENT_ID!,
		clientSecret: process.env.GITHUB_CLIENT_SECRET!,
		authorizationUrl: "https://github.com/login/oauth/authorize",
		tokenUrl: "https://github.com/login/oauth/access_token",
		userInfoUrl: "https://api.github.com/user",
		scopes: ["repo", "read:discussion", "project"],
		redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth2/callback/github`,
	},
];

export const INTEGRATIONS = [
	{
		id: "slack",
		name: "Slack",
		description: "lorem",
		category: "communication" as IntegrationCategory,
		logo: "/slack-logo.png",
		status: "inactive" as IntegrationStatus,
		authType: "oauth",
		lastSyncAt: new Date(),
		docsUrl: "https://api.slack.com/",
	},
	{
		id: "github",
		name: "GitHub",
		description: "lorem",
		category: "version_control" as IntegrationCategory,
		logo: "/github-logo.png",
		status: "inactive" as IntegrationStatus,
		authType: "oauth",
		lastSyncAt: new Date(),
		docsUrl: "https://api.github.com/",
	},
];

export const getProviderLogo = (providerId: string) => {
	switch (providerId) {
		case "slack":
			return "/slack-logo.png";
		case "github":
			return "/github-logo.png";
		case "jira":
			return "/jira-logo.png";
		case "linear":
			return "/linear-logo.png";
		default:
			return "/placeholder.svg";
	}
};

export const getIntegrationCategory = (providerId: string) => {
	switch (providerId) {
		case "slack":
			return IntegrationCategory.communication;
		default:
			return IntegrationCategory.other;
	}
};
