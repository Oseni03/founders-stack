import { NextResponse } from "next/server";

export async function GET() {
	// Mock data - replace with actual database queries
	const data = {
		integrations: [
			{
				id: "github",
				name: "GitHub",
				description:
					"Sync repositories, issues, pull requests, and commits",
				category: "project",
				logo: "/placeholder.svg?height=32&width=32",
				status: "connected",
				authType: "oauth",
				lastSync: "5 min ago",
				syncFrequency: "15",
				nextSync: "in 10 min",
				docsUrl: "https://docs.github.com/en/rest",
			},
			{
				id: "jira",
				name: "Jira",
				description:
					"Import tasks, sprints, and project management data",
				category: "project",
				logo: "/placeholder.svg?height=32&width=32",
				status: "connected",
				authType: "api_key",
				lastSync: "12 min ago",
				syncFrequency: "30",
				nextSync: "in 18 min",
				docsUrl:
					"https://developer.atlassian.com/cloud/jira/platform/rest/v3/",
			},
			{
				id: "stripe",
				name: "Stripe",
				description:
					"Track payments, subscriptions, and revenue metrics",
				category: "payments",
				logo: "/placeholder.svg?height=32&width=32",
				status: "connected",
				authType: "api_key",
				lastSync: "8 min ago",
				syncFrequency: "15",
				nextSync: "in 7 min",
				docsUrl: "https://stripe.com/docs/api",
			},
			{
				id: "sentry",
				name: "Sentry",
				description:
					"Monitor errors, exceptions, and application health",
				category: "monitoring",
				logo: "/placeholder.svg?height=32&width=32",
				status: "disconnected",
				authType: "api_key",
				docsUrl: "https://docs.sentry.io/api/",
			},
			{
				id: "linear",
				name: "Linear",
				description: "Sync issues, projects, and team workflows",
				category: "project",
				logo: "/placeholder.svg?height=32&width=32",
				status: "disconnected",
				authType: "oauth",
				docsUrl: "https://developers.linear.app/docs",
			},
			{
				id: "slack",
				name: "Slack",
				description:
					"Get notifications and team communication insights",
				category: "communication",
				logo: "/placeholder.svg?height=32&width=32",
				status: "connected",
				authType: "oauth",
				lastSync: "3 min ago",
				syncFrequency: "5",
				nextSync: "in 2 min",
				docsUrl: "https://api.slack.com/",
			},
			{
				id: "google-analytics",
				name: "Google Analytics",
				description:
					"Track user behavior, traffic, and conversion metrics",
				category: "analytics",
				logo: "/placeholder.svg?height=32&width=32",
				status: "disconnected",
				authType: "oauth",
				docsUrl: "https://developers.google.com/analytics",
			},
			{
				id: "amplitude",
				name: "Amplitude",
				description: "Analyze product usage and user engagement",
				category: "analytics",
				logo: "/placeholder.svg?height=32&width=32",
				status: "disconnected",
				authType: "api_key",
				docsUrl: "https://www.docs.developers.amplitude.com/",
			},
			{
				id: "gitlab",
				name: "GitLab",
				description:
					"Sync repositories, merge requests, and CI/CD pipelines",
				category: "project",
				logo: "/placeholder.svg?height=32&width=32",
				status: "disconnected",
				authType: "oauth",
				docsUrl: "https://docs.gitlab.com/ee/api/",
			},
		],
	};

	return NextResponse.json(data);
}
