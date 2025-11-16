"use client";
import { useTasksStore } from "@/zustand/providers/task-store-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Task } from "@/zustand/stores/task-store";

interface TaskListProps {
	tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
	const setSelectedTask = useTasksStore((state) => state.setSelectedTask);

	return (
		<div className="space-y-4">
			{tasks.map((task) => (
				<Card
					key={task.id}
					className="cursor-pointer hover:shadow-md"
					onClick={() => setSelectedTask(task)}
				>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Badge>{task.project.name}</Badge>
									<h3 className="font-semibold">
										{task.title}
									</h3>
								</div>
								<div className="text-sm text-muted-foreground">
									Due:{" "}
									{task.dueDate
										? format(new Date(task.dueDate), "PPP")
										: "No due date"}
									{task.status === "Blocked" && (
										<span className="ml-2 text-destructive">
											Blocked
										</span>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Badge
									variant={
										task.priority === "High"
											? "destructive"
											: "secondary"
									}
								>
									{task.priority}
								</Badge>
								{task.assigneeAvatar && (
									<Avatar className="h-6 w-6">
										<AvatarFallback>
											{task.assigneeName?.[0] || "?"}
										</AvatarFallback>
									</Avatar>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
