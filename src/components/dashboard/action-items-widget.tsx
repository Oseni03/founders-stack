"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/zustand/providers/dashboard-store-provider";
import { Task, PullRequest, Message, SupportTicket } from "@prisma/client";
import { cn } from "@/lib/utils";

interface ActionItemsWidgetProps {
	initialData: {
		tasks: Task[];
		pullRequests: PullRequest[];
		messages: Message[];
		supportTickets: SupportTicket[];
	};
}

export function ActionItemsWidget({ initialData }: ActionItemsWidgetProps) {
	const { actionItems, setActionItems } = useDashboardStore((state) => ({
		actionItems: state.actionItems,
		setActionItems: state.setActionItems,
	}));

	// Initialize with server data
	setActionItems(initialData);

	const getUrgencyClass = (dueDate?: Date | null, status?: string) => {
		if (!dueDate) return "bg-green-100";
		const now = new Date();
		const due = new Date(dueDate);
		if (due < now) return "bg-red-100";
		if (due.toDateString() === now.toDateString()) return "bg-yellow-100";
		return "bg-green-100";
	};

	return (
		<Card className="shadow-sm">
			<CardHeader>
				<CardTitle>My Action Items</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2">
					{actionItems.tasks.map((task) => (
						<li
							key={task.id}
							className={cn(
								"p-2 rounded",
								getUrgencyClass(task.dueDate, task.status)
							)}
						>
							<div className="flex justify-between">
								<span>{task.title}</span>
								<Button variant="ghost" size="sm">
									Mark Done
								</Button>
							</div>
						</li>
					))}
					{actionItems.pullRequests.map((pr) => (
						<li key={pr.id} className="p-2 rounded bg-yellow-100">
							<div className="flex justify-between">
								<span>{pr.title}</span>
								<Button variant="ghost" size="sm">
									Review
								</Button>
							</div>
						</li>
					))}
					{actionItems.messages.map((msg) => (
						<li key={msg.id} className="p-2 rounded bg-blue-100">
							<div className="flex justify-between">
								<span>{msg.content.slice(0, 50)}...</span>
								<Button variant="ghost" size="sm">
									Reply
								</Button>
							</div>
						</li>
					))}
					{actionItems.supportTickets.map((ticket) => (
						<li key={ticket.id} className="p-2 rounded bg-red-100">
							<div className="flex justify-between">
								<span>{ticket.subject}</span>
								<Button variant="ghost" size="sm">
									View
								</Button>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
