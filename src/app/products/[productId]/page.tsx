import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getCurrentUser } from "@/server/users";
import { NotificationsWidget } from "@/components/dashboard/notifications-widget";
import { MetricsWidget } from "@/components/dashboard/metrics-widget";
import { ActivityTimelineWidget } from "@/components/dashboard/activity-timeline-widget";
import { TeamPulseWidget } from "@/components/dashboard/team-pulse-widget";
import { ActionItemsWidget } from "@/components/dashboard/action-items-widget";
import { SprintStatusWidget } from "@/components/dashboard/sprint-status-widget";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId: organizationId } = await params;
	const { user } = await getCurrentUser();

	if (!organizationId || !user) {
		return <div className="text-red-500">Error: No organization found</div>;
	}

	// Fetch action items
	const tasks = await prisma.task.findMany({
		where: {
			organizationId,
			assigneeId: user.id,
			status: { in: ["To Do", "In Progress"] },
		},
		take: 10,
	});

	const pullRequests = await prisma.pullRequest.findMany({
		where: {
			repository: {
				organizationId,
			},
			state: "OPEN",
		},
		take: 5,
	});

	const messages = await prisma.message.findMany({
		where: { organizationId, mentions: { has: user.id } },
		orderBy: { timestamp: "desc" },
		take: 5,
	});

	const supportTickets = await prisma.supportTicket.findMany({
		where: {
			organizationId,
			assignedToId: user.id,
			status: { not: "RESOLVED" },
		},
		take: 5,
	});

	// Fetch metrics
	const metrics = await prisma.analyticsData.findMany({
		where: { organizationId },
		orderBy: { timestamp: "desc" },
		take: 4,
	});

	// Fetch sprint status
	const sprintTasks = await prisma.task.findMany({
		where: { organizationId, sprintId: { not: null } },
		select: { status: true, id: true, title: true },
	});

	// Fetch recent activity
	const recentActivity = await prisma.comment.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
		take: 10,
		include: {
			task: { select: { title: true } },
			message: { select: { content: true } },
			author: true,
		},
	});

	// Fetch team pulse
	const teamMembers = await prisma.member.findMany({
		where: { organizationId },
		select: { id: true, user: true },
		take: 10,
	});

	return (
		<div className="space-y-6">
			<DashboardHeader />
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<ActionItemsWidget
					initialData={{
						tasks,
						pullRequests,
						messages,
						supportTickets,
					}}
				/>
				<NotificationsWidget
					initialData={messages.map((m) => ({
						id: m.id,
						type: "mention",
						content: m.content,
						source: m.platform,
						timestamp: m.timestamp.toISOString(),
					}))}
				/>
				<MetricsWidget
					initialData={metrics.map((m) => ({
						name: m.metricName,
						value: m.metricValue,
						unit: m.metricUnit || "",
						trend: 0, // Calculate trend server-side if needed
						health: m.metricValue > 0 ? "good" : "critical",
					}))}
				/>
				<SprintStatusWidget
					initialData={{
						progress: sprintTasks.length
							? (sprintTasks.filter((t) => t.status === "Done")
									.length /
									sprintTasks.length) *
								100
							: 0,
						tasks: {
							done: sprintTasks.filter((t) => t.status === "Done")
								.length,
							inProgress: sprintTasks.filter(
								(t) => t.status === "In Progress"
							).length,
							toDo: sprintTasks.filter(
								(t) => t.status === "To Do"
							).length,
						},
						blockers: tasks.filter((t) => t.status === "Blocked"),
					}}
				/>
				<ActivityTimelineWidget
					initialData={recentActivity.map((c) => ({
						id: c.id,
						user: c.author,
						action: c.task
							? "commented on task"
							: c.message
								? "commented on message"
								: "performed an action",
						item:
							c.task?.title ||
							c.message?.content.slice(0, 50) ||
							"Unknown",
						timestamp: c.createdAt.toISOString(),
					}))}
				/>
				<TeamPulseWidget
					initialData={teamMembers.map((u) => ({
						user: u.user.name || "Unknown",
						status: (Math.random() > 0.5
							? "online"
							: Math.random() > 0.5
								? "away"
								: "offline") as "online" | "away" | "offline",
						currentTask: "", // Fetch from active task if available
					}))}
				/>
			</div>
		</div>
	);
}
