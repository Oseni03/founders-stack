import { NextResponse } from "next/server";

interface Task {
	id: string;
	title: string;
	description: string;
	status: "open" | "in_progress" | "done" | "blocked";
	priority: "low" | "medium" | "high" | "urgent";
	assignee: string | null;
	dueDate: string | null;
	source: "github" | "jira" | "linear" | "asana";
	externalUrl: string;
	createdAt: string;
}

// Mock data - In production, this would aggregate from multiple APIs
const mockTasks: Task[] = [
	{
		id: "gh-1",
		title: "Fix authentication bug in login flow",
		description: "Users are experiencing issues with OAuth login redirects",
		status: "in_progress",
		priority: "urgent",
		assignee: "Sarah Chen",
		dueDate: "2025-01-15",
		source: "github",
		externalUrl: "https://github.com/example/repo/issues/123",
		createdAt: "2025-01-10T10:00:00Z",
	},
	{
		id: "gh-2",
		title: "Implement dark mode toggle",
		description: "Add system preference detection and manual toggle",
		status: "open",
		priority: "medium",
		assignee: "Alex Kumar",
		dueDate: "2025-01-20",
		source: "github",
		externalUrl: "https://github.com/example/repo/issues/124",
		createdAt: "2025-01-11T14:30:00Z",
	},
	{
		id: "jira-1",
		title: "Design new onboarding flow",
		description:
			"Create wireframes and prototypes for improved user onboarding",
		status: "in_progress",
		priority: "high",
		assignee: "Maria Garcia",
		dueDate: "2025-01-18",
		source: "jira",
		externalUrl: "https://example.atlassian.net/browse/PROJ-456",
		createdAt: "2025-01-09T09:15:00Z",
	},
	{
		id: "jira-2",
		title: "Update API documentation",
		description: "Document new endpoints and deprecate old ones",
		status: "open",
		priority: "medium",
		assignee: null,
		dueDate: "2025-01-25",
		source: "jira",
		externalUrl: "https://example.atlassian.net/browse/PROJ-457",
		createdAt: "2025-01-12T11:00:00Z",
	},
	{
		id: "linear-1",
		title: "Optimize database queries",
		description: "Reduce query time for dashboard analytics by 50%",
		status: "in_progress",
		priority: "high",
		assignee: "James Wilson",
		dueDate: "2025-01-16",
		source: "linear",
		externalUrl: "https://linear.app/example/issue/ENG-789",
		createdAt: "2025-01-08T16:45:00Z",
	},
	{
		id: "linear-2",
		title: "Add export functionality",
		description: "Allow users to export data in CSV and JSON formats",
		status: "open",
		priority: "low",
		assignee: "Sarah Chen",
		dueDate: "2025-02-01",
		source: "linear",
		externalUrl: "https://linear.app/example/issue/ENG-790",
		createdAt: "2025-01-13T13:20:00Z",
	},
	{
		id: "linear-3",
		title: "Implement rate limiting",
		description: "Add rate limiting to prevent API abuse",
		status: "blocked",
		priority: "urgent",
		assignee: "Alex Kumar",
		dueDate: "2025-01-14",
		source: "linear",
		externalUrl: "https://linear.app/example/issue/ENG-791",
		createdAt: "2025-01-07T08:30:00Z",
	},
	{
		id: "asana-1",
		title: "Q1 Marketing Campaign Planning",
		description: "Plan and schedule social media content for Q1",
		status: "in_progress",
		priority: "medium",
		assignee: "Maria Garcia",
		dueDate: "2025-01-22",
		source: "asana",
		externalUrl: "https://app.asana.com/0/123456789/987654321",
		createdAt: "2025-01-06T10:00:00Z",
	},
	{
		id: "asana-2",
		title: "Customer feedback analysis",
		description: "Analyze Q4 customer feedback and create action items",
		status: "done",
		priority: "medium",
		assignee: "James Wilson",
		dueDate: "2025-01-12",
		source: "asana",
		externalUrl: "https://app.asana.com/0/123456789/987654322",
		createdAt: "2025-01-05T15:30:00Z",
	},
	{
		id: "gh-3",
		title: "Upgrade to Next.js 15",
		description: "Migrate codebase to Next.js 15 and test all features",
		status: "open",
		priority: "low",
		assignee: null,
		dueDate: null,
		source: "github",
		externalUrl: "https://github.com/example/repo/issues/125",
		createdAt: "2025-01-14T12:00:00Z",
	},
	{
		id: "jira-3",
		title: "Security audit Q1",
		description: "Conduct comprehensive security audit of the platform",
		status: "open",
		priority: "high",
		assignee: "Alex Kumar",
		dueDate: "2025-01-30",
		source: "jira",
		externalUrl: "https://example.atlassian.net/browse/PROJ-458",
		createdAt: "2025-01-13T09:00:00Z",
	},
	{
		id: "linear-4",
		title: "Mobile app prototype",
		description: "Create initial prototype for iOS and Android apps",
		status: "open",
		priority: "medium",
		assignee: "Sarah Chen",
		dueDate: "2025-02-15",
		source: "linear",
		externalUrl: "https://linear.app/example/issue/ENG-792",
		createdAt: "2025-01-14T14:00:00Z",
	},
];

export async function GET() {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 800));

	// Calculate task counts by source
	const counts = {
		github: mockTasks.filter((t) => t.source === "github").length,
		jira: mockTasks.filter((t) => t.source === "jira").length,
		linear: mockTasks.filter((t) => t.source === "linear").length,
		asana: mockTasks.filter((t) => t.source === "asana").length,
		total: mockTasks.length,
	};

	return NextResponse.json({
		tasks: mockTasks,
		counts,
	});
}
