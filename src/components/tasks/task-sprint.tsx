"use client";
import { useTasksStore } from "@/zustand/providers/task-store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, subDays } from "date-fns";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";
import { Task } from "@/zustand/stores/task-store";

interface TaskSprintProps {
	tasks: Task[];
}

export function TaskSprint({ tasks }: TaskSprintProps) {
	const setSelectedTask = useTasksStore((state) => state.setSelectedTask);

	// Group tasks by status
	const statusGroups = {
		"To Do": tasks.filter((t) => t.status === "To Do"),
		"In Progress": tasks.filter((t) => t.status === "In Progress"),
		"In Review": tasks.filter((t) => t.status === "In Review"),
		Done: tasks.filter((t) => t.status === "Done"),
	};

	// Mock sprint data
	const sprint = {
		name: "Sprint 23",
		daysRemaining: 5,
		goals: "Complete payment integration and fix login bugs",
		totalPoints: 100,
	};

	// Burndown chart data (mocked for demo)
	const burndownData = Array.from({ length: 14 }, (_, i) => ({
		date: format(subDays(new Date(), 13 - i), "MMM d"),
		ideal: 100 - (i * 100) / 13,
		actual: 100 - (i * 70) / 13 - (i % 2 === 0 ? 5 : 0), // Slightly varied actual data
	}));

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>
						{sprint.name}{" "}
						<Badge>{sprint.daysRemaining} days remaining</Badge>
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Goals: {sprint.goals}
					</p>
				</CardHeader>
				<CardContent>
					<div className="h-[300px]">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart
								data={burndownData}
								margin={{
									top: 20,
									right: 30,
									left: 20,
									bottom: 20,
								}}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#e5e7eb"
								/>
								<XAxis
									dataKey="date"
									label={{
										value: "Date",
										position: "bottom",
										offset: 0,
									}}
									stroke="#6b7280"
								/>
								<YAxis
									label={{
										value: "Story Points",
										angle: -90,
										position: "insideLeft",
									}}
									stroke="#6b7280"
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "#ffffff",
										border: "1px solid #e5e7eb",
										borderRadius: "4px",
									}}
								/>
								<Legend verticalAlign="top" height={36} />
								<Line
									type="monotone"
									dataKey="ideal"
									name="Ideal Burndown"
									stroke="#3b82f6"
									strokeWidth={2}
									dot={false}
								/>
								<Line
									type="monotone"
									dataKey="actual"
									name="Actual Burndown"
									stroke="#ef4444"
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>

			{Object.entries(statusGroups).map(([status, tasks]) => (
				<Card key={status}>
					<CardHeader>
						<CardTitle>{status}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{tasks.map((task) => (
							<Card
								key={task.id}
								className="cursor-pointer hover:shadow-md"
								onClick={() => setSelectedTask(task)}
							>
								<CardContent className="p-3">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<Badge>{task.project.name}</Badge>
											<h4 className="text-sm font-medium">
												{task.title}
											</h4>
										</div>
										<div className="flex items-center justify-between text-xs text-muted-foreground">
											<span>
												Due:{" "}
												{task.dueDate
													? format(
															new Date(
																task.dueDate
															),
															"PPP"
														)
													: "N/A"}
											</span>
											<Badge
												variant={
													task.priority === "High"
														? "destructive"
														: "secondary"
												}
											>
												{task.priority}
											</Badge>
										</div>
										{task.assigneeAvatar && (
											<Avatar className="h-5 w-5">
												<AvatarFallback>
													{task.assigneeName?.[0] ||
														"?"}
												</AvatarFallback>
											</Avatar>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
