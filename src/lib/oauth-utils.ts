import { IntegrationCategory } from "@prisma/client";

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
			"files:write",
			"users:read",
			"team:read",
			"groups:history",
			"groups:read",
		],
		redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations/slack`,
	},
];

export const getProviderLogo = (providerId: string) => {
	switch (providerId) {
		case "slack":
			return "/slack-logo.png";
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
