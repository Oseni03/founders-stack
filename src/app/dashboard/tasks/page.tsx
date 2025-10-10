"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import TasksTable from "@/components/tasks/tasks-table";
import { Task } from "@prisma/client";
import { taskSourceColors } from "@/lib/oauth-utils";
import { TasksFilters } from "@/components/tasks/tasks-filters";
import { Card, CardContent } from "@/components/ui/card";

interface TaskCounts {
	github: number;
	jira: number;
	linear: number;
	asana: number;
	trello: number;
	total: number;
}

export default function TasksPage() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
	const [taskCounts, setTaskCounts] = useState<TaskCounts>({
		github: 0,
		jira: 0,
		linear: 0,
		asana: 0,
		trello: 0,
		total: 0,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch tasks
	useEffect(() => {
		const fetchTasks = async () => {
			try {
				setLoading(true);
				const response = await fetch("/api/tasks");
				if (!response.ok) throw new Error("Failed to fetch tasks");
				const data = await response.json();
				setTasks(data.tasks);
				setFilteredTasks(data.tasks);
				setTaskCounts(data.counts);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "An error occurred"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchTasks();
	}, []);

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-foreground">Tasks</h1>
				<p className="text-muted-foreground mt-1">
					Aggregated tasks from all your project management tools
				</p>
			</div>

			{/* Task Count Badges */}
			<div className="flex flex-wrap gap-3">
				<Card className="flex-1 min-w-[140px]">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Total Tasks
								</p>
								<p className="text-2xl font-bold text-foreground">
									{taskCounts.total}
								</p>
							</div>
							<Badge variant="outline" className="text-lg">
								All
							</Badge>
						</div>
					</CardContent>
				</Card>
				<Card className="flex-1 min-w-[140px]">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									GitHub
								</p>
								<p className="text-2xl font-bold text-foreground">
									{taskCounts.github}
								</p>
							</div>
							<Badge className={taskSourceColors.github}>
								GH
							</Badge>
						</div>
					</CardContent>
				</Card>
				<Card className="flex-1 min-w-[140px]">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Jira
								</p>
								<p className="text-2xl font-bold text-foreground">
									{taskCounts.jira}
								</p>
							</div>
							<Badge className={taskSourceColors.jira}>JR</Badge>
						</div>
					</CardContent>
				</Card>
				<Card className="flex-1 min-w-[140px]">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Linear
								</p>
								<p className="text-2xl font-bold text-foreground">
									{taskCounts.linear}
								</p>
							</div>
							<Badge className={taskSourceColors.linear}>
								LN
							</Badge>
						</div>
					</CardContent>
				</Card>
				<Card className="flex-1 min-w-[140px]">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Asana
								</p>
								<p className="text-2xl font-bold text-foreground">
									{taskCounts.asana}
								</p>
							</div>
							<Badge className={taskSourceColors.asana}>AS</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<TasksFilters
				tasks={tasks}
				filteredTasks={filteredTasks}
				setFilteredTasks={setFilteredTasks}
			/>

			{/* Tasks Table */}
			<TasksTable tasks={filteredTasks} loading={loading} error={error} />
		</div>
	);
}
