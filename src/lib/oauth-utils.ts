import { IntegrationCategory, IntegrationStatus } from "@prisma/client";

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
}

export const INTEGRATIONS: Integration[] = [
	{
		id: "slack",
		name: "Slack",
		description: "Connect to sync messages and notifications",
		category: "communication",
		logo: "/slack-logo.png",
		status: "inactive",
		authType: "oauth2",
		lastSyncAt: new Date(),
		docsUrl: "https://docs.slack.dev/",
	},
	{
		id: "github",
		name: "GitHub",
		description: "Integrate to track commits and pull requests",
		category: "version_control",
		logo: "/github-logo.png",
		status: "inactive",
		authType: "oauth2",
		lastSyncAt: new Date(),
		docsUrl: "https://docs.github.com/",
	},
	{
		id: "asana",
		name: "Asana",
		description: "Sync tasks and project updates",
		category: "project_management",
		logo: "/asana-logo.png",
		status: "inactive",
		authType: "oauth2",
		lastSyncAt: new Date(),
		docsUrl: "https://developers.asana.com/docs",
	},
	{
		id: "posthog",
		name: "PostHog",
		description:
			"Track product and web analytics like page views and funnels",
		category: "analytics",
		logo: "/posthog-logo.png",
		status: "inactive",
		authType: "api_key",
		lastSyncAt: new Date(),
		docsUrl: "https://posthog.com/docs/api",
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
		case "asana":
			return IntegrationCategory.project_management;
		case "slack":
			return IntegrationCategory.communication;
		case "github":
			return IntegrationCategory.version_control;
		default:
			return IntegrationCategory.other;
	}
};

export const taskSourceColors = {
	github: "bg-gray-900 text-white dark:bg-gray-700",
	jira: "bg-blue-600 text-white",
	linear: "bg-purple-600 text-white",
	asana: "bg-pink-600 text-white",
};
