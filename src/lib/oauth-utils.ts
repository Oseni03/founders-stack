import { IntegrationCategory, IntegrationStatus } from "@prisma/client";

export const INTEGRATIONS = [
	{
		id: "slack",
		name: "Slack",
		description: "lorem",
		category: "communication" as IntegrationCategory,
		logo: "/slack-logo.png",
		status: "inactive" as IntegrationStatus,
		authType: "oauth2",
		lastSyncAt: new Date(),
		docsUrl: "https://docs.slack.dev/",
	},
	{
		id: "github",
		name: "GitHub",
		description: "lorem",
		category: "version_control" as IntegrationCategory,
		logo: "/github-logo.png",
		status: "inactive" as IntegrationStatus,
		authType: "oauth2",
		lastSyncAt: new Date(),
		docsUrl: "https://docs.github.com/",
	},
	{
		id: "asana",
		name: "Asana",
		description: "lorem",
		category: "project_management" as IntegrationCategory,
		logo: "/asana-logo.png",
		status: "inactive" as IntegrationStatus,
		authType: "oauth2",
		lastSyncAt: new Date(),
		docsUrl: "https://developers.asana.com/docs",
	},
	// {
	// 	id: "trello",
	// 	name: "Trello",
	// 	description: "lorem",
	// 	category: "project_management" as IntegrationCategory,
	// 	logo: "/trello-logo.png",
	// 	status: "inactive" as IntegrationStatus,
	// 	authType: "oauth1a",
	// 	lastSyncAt: new Date(),
	// 	docsUrl: "https://trello.com/guide",
	// },
];

export const getProviderLogo = (providerId: string) => {
	switch (providerId) {
		case "trello":
			return "/trello-logo.png";
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
		case "trello":
			return IntegrationCategory.project_management;
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
