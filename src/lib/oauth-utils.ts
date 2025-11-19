import { IntegrationCategory, IntegrationStatus } from "@prisma/client";
import { Integration as DBIntegration } from "@prisma/client";

export interface Integration {
	id: string;
	name: string;
	description: string;
	category: IntegrationCategory;
	logo: string;
	status: IntegrationStatus;
	authType: "oauth2" | "api_key";
	lastSyncAt: Date;
	docsUrl: string;
	metadata?: null | {
		/** Only for API-key integrations that need a manual webhook */
		webhook?: {
			/** Markdown/HTML that explains where to paste it */
			instructions: string;
			/** Text for the checkbox (default: "I have added the webhook") */
			confirmLabel?: string;
		};
	};
}

// OAuth configuration types
type OAuthConfigBase = {
	providerId: string;
	clientId: string;
	clientSecret: string;
	authorizationUrl: string;
	tokenUrl: string;
	redirectURI: string;
	category: IntegrationCategory;
};

type StandardOAuthConfig = OAuthConfigBase & {
	scopes: string[];
};

type SlackOAuthConfig = OAuthConfigBase & {
	userScopes: string[];
};

export type OAuthConfig = StandardOAuthConfig | SlackOAuthConfig;

// OAuth configuration for different providers
export const OAUTH_CONFIG: Record<string, OAuthConfig> = {
	github: {
		providerId: "github",
		clientId: process.env.GITHUB_CLIENT_ID!,
		clientSecret: process.env.GITHUB_CLIENT_SECRET!,
		authorizationUrl: "https://github.com/login/oauth/authorize",
		tokenUrl: "https://github.com/login/oauth/access_token",
		scopes: [
			"repo",
			"read:discussion",
			"project",
			"read:user",
			"user:email",
		],
		redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/github/callback`,
		category: "CODE",
	},
	jira: {
		providerId: "jira",
		clientId: process.env.JIRA_CLIENT_ID!,
		clientSecret: process.env.JIRA_CLIENT_SECRET!,
		authorizationUrl: "https://auth.atlassian.com/authorize",
		tokenUrl: "https://auth.atlassian.com/oauth/token",
		scopes: [
			"read:jira-work",
			"manage:jira-project",
			"write:jira-work",
			"manage:jira-webhook",
			"read:jira-user",
			"manage:jira-configuration",
			"manage:jira-data-provider",
		],
		redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/jira/callback`,
		category: "PROJECT_TRACKING",
	},
	slack: {
		providerId: "slack",
		clientId: process.env.SLACK_CLIENT_ID!,
		clientSecret: process.env.SLACK_CLIENT_SECRET!,
		authorizationUrl: "https://slack.com/oauth/v2/authorize",
		tokenUrl: "https://slack.com/api/oauth.v2.access",
		userScopes: [
			"channels:history",
			"channels:read",
			"chat:write",
			"groups:read",
			"im:read",
			"mpim:read",
			"im:history",
			"mpim:history",
			"users:read",
			"users:read.email",
		],
		redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/slack/callback`,
		category: "COMMUNICATION",
	},
	google_analytics: {
		providerId: "google-analytics",
		clientId: process.env.GOOGLE_CLIENT_ID!,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
		tokenUrl: "https://slack.com/api/oauth.v2.access",
		userScopes: ["https://www.googleapis.com/auth/analytics.readonly"],
		redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-analytics/callback`,
		category: "ANALYTICS",
	},
};

export type ToolName = keyof typeof OAUTH_CONFIG;

export const INTEGRATIONS: Integration[] = [
	{
		id: "slack",
		name: "Slack",
		description: "Connect to sync messages and notifications",
		category: "COMMUNICATION",
		logo: "/slack-logo.png",
		status: "DISCONNECTED",
		authType: "oauth2",
		lastSyncAt: new Date(),
		docsUrl: "https://docs.slack.dev/",
	},
	{
		id: "github",
		name: "GitHub",
		description: "Integrate to track commits and pull requests",
		category: "CODE",
		logo: "/github-logo.png",
		status: "DISCONNECTED",
		authType: "oauth2",
		lastSyncAt: new Date(),
		docsUrl: "https://docs.github.com/",
	},
	{
		id: "jira",
		name: "Jira",
		description: "Sync tasks and project updates",
		category: "PROJECT_TRACKING",
		logo: "/jira-logo.png",
		status: "DISCONNECTED",
		authType: "oauth2",
		lastSyncAt: new Date(),
		docsUrl: "https://developers.jira.com/docs",
	},
	{
		id: "canny",
		name: "Canny",
		description:
			"Track product and web analytics like page views and funnels",
		category: "FEEDBACK",
		logo: "/canny-logo.png",
		status: "CONNECTED",
		authType: "api_key",
		lastSyncAt: new Date(),
		docsUrl: "https://developers.canny.io/api-reference",
		metadata: {
			webhook: {
				instructions: `
### Setting up Canny Webhooks

1. Log in to your **Canny account**
2. Click your **profile** in the top-right corner
3. Navigate to **Settings → API & Webhooks**
4. In the Webhooks section, click **Add Webhook**
5. Paste your webhook URL (provided below)
6. Select the events you want to receive:
   - **post.created** - When a new post is created
   - **post.deleted** - When a post is deleted
   - **post.status_changed** - When a post's status changes
   - **post.jira_issue_linked** - When a post is linked to a Jira issue
   - **comment.created** - When a new comment is added
   - **comment.deleted** - When a comment is removed
   - **vote.created** - When a user votes on a post
   - **vote.deleted** - When a user removes a vote from a post
7. Click **Save** to activate the webhook

Your webhook will now receive real-time notifications when these events occur in Canny.
            `,
				confirmLabel: "I have added the webhook URL in Canny",
			},
		},
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
		case "canny":
			return "/canny-logo.png";
		default:
			return "/placeholder.svg";
	}
};

export const getIntegrationCategory = (
	providerId: string
): IntegrationCategory => {
	switch (providerId) {
		case "slack":
			return IntegrationCategory.COMMUNICATION;
		case "github":
			return IntegrationCategory.CODE;
		case "canny":
			return IntegrationCategory.FEEDBACK;
		case "jira":
			return IntegrationCategory.PROJECT_TRACKING;
		default:
			return IntegrationCategory.OTHER;
	}
};

export const taskSourceColors = {
	github: "bg-gray-900 text-white dark:bg-gray-700",
	jira: "bg-blue-600 text-white",
	linear: "bg-purple-600 text-white",
};

export function mergeIntegrations(
	staticIntegrations: Integration[],
	userIntegrations: DBIntegration[]
): Integration[] {
	// Create a map of user integrations by toolName for quick lookup
	const userIntegrationMap = new Map(
		userIntegrations.map((integration) => [
			integration.platform.toLowerCase(),
			integration,
		])
	);

	// Map through static integrations and update with user data
	return staticIntegrations.map((staticIntegration) => {
		const userIntegration = userIntegrationMap.get(
			staticIntegration.id.toLowerCase()
		);

		if (userIntegration) {
			// User has this integration active
			return {
				...staticIntegration,
				status: userIntegration.status,
				lastSyncAt:
					userIntegration.lastSyncAt || staticIntegration.lastSyncAt,
			};
		}

		// User doesn't have this integration - return as inactive
		return {
			...staticIntegration,
			status: "DISCONNECTED",
		};
	});
}
