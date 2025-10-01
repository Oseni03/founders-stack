"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Search, Filter, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

interface TaskCounts {
	github: number;
	jira: number;
	linear: number;
	asana: number;
	total: number;
}

const statusColors = {
	open: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
	in_progress: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
	done: "bg-green-500/10 text-green-700 dark:text-green-400",
	blocked: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const priorityColors = {
	low: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
	medium: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
	high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
	urgent: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const sourceColors = {
	github: "bg-gray-900 text-white dark:bg-gray-700",
	jira: "bg-blue-600 text-white",
	linear: "bg-purple-600 text-white",
	asana: "bg-pink-600 text-white",
};

export default function TasksPage() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
	const [taskCounts, setTaskCounts] = useState<TaskCounts>({
		github: 0,
		jira: 0,
		linear: 0,
		asana: 0,
		total: 0,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [toolFilter, setToolFilter] = useState<string>("all");
	const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
	const [priorityFilter, setPriorityFilter] = useState<string>("all");

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

	// Apply filters
	useEffect(() => {
		let filtered = [...tasks];

		// Search filter
		if (searchQuery) {
			filtered = filtered.filter(
				(task) =>
					task.title
						.toLowerCase()
						.includes(searchQuery.toLowerCase()) ||
					task.description
						.toLowerCase()
						.includes(searchQuery.toLowerCase())
			);
		}

		// Status filter
		if (statusFilter !== "all") {
			filtered = filtered.filter((task) => task.status === statusFilter);
		}

		// Tool filter
		if (toolFilter !== "all") {
			filtered = filtered.filter((task) => task.source === toolFilter);
		}

		// Assignee filter
		if (assigneeFilter !== "all") {
			filtered = filtered.filter(
				(task) => task.assignee === assigneeFilter
			);
		}

		// Priority filter
		if (priorityFilter !== "all") {
			filtered = filtered.filter(
				(task) => task.priority === priorityFilter
			);
		}

		setFilteredTasks(filtered);
	}, [
		searchQuery,
		statusFilter,
		toolFilter,
		assigneeFilter,
		priorityFilter,
		tasks,
	]);

	// Get unique assignees
	const uniqueAssignees = Array.from(
		new Set(tasks.map((task) => task.assignee).filter(Boolean))
	);

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "No due date";
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

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
							<Badge className={sourceColors.github}>GH</Badge>
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
							<Badge className={sourceColors.jira}>JR</Badge>
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
							<Badge className={sourceColors.linear}>LN</Badge>
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
							<Badge className={sourceColors.asana}>AS</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Filter className="h-5 w-5" />
						Filters
					</CardTitle>
					<CardDescription>
						Filter and search across all your tasks
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						{/* Search */}
						<div className="lg:col-span-2">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search tasks..."
									value={searchQuery}
									onChange={(e) =>
										setSearchQuery(e.target.value)
									}
									className="pl-9"
								/>
							</div>
						</div>

						{/* Status Filter */}
						<Select
							value={statusFilter}
							onValueChange={setStatusFilter}
						>
							<SelectTrigger>
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									All Statuses
								</SelectItem>
								<SelectItem value="open">Open</SelectItem>
								<SelectItem value="in_progress">
									In Progress
								</SelectItem>
								<SelectItem value="done">Done</SelectItem>
								<SelectItem value="blocked">Blocked</SelectItem>
							</SelectContent>
						</Select>

						{/* Tool Filter */}
						<Select
							value={toolFilter}
							onValueChange={setToolFilter}
						>
							<SelectTrigger>
								<SelectValue placeholder="Tool" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Tools</SelectItem>
								<SelectItem value="github">GitHub</SelectItem>
								<SelectItem value="jira">Jira</SelectItem>
								<SelectItem value="linear">Linear</SelectItem>
								<SelectItem value="asana">Asana</SelectItem>
							</SelectContent>
						</Select>

						{/* Priority Filter */}
						<Select
							value={priorityFilter}
							onValueChange={setPriorityFilter}
						>
							<SelectTrigger>
								<SelectValue placeholder="Priority" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									All Priorities
								</SelectItem>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="urgent">Urgent</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Assignee Filter - Second Row */}
					<div className="mt-4">
						<Select
							value={assigneeFilter}
							onValueChange={setAssigneeFilter}
						>
							<SelectTrigger className="max-w-xs">
								<SelectValue placeholder="Assignee" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									All Assignees
								</SelectItem>
								{uniqueAssignees.map((assignee) => (
									<SelectItem
										key={assignee}
										value={assignee!}
									>
										{assignee}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Active Filters Summary */}
					{(searchQuery ||
						statusFilter !== "all" ||
						toolFilter !== "all" ||
						assigneeFilter !== "all" ||
						priorityFilter !== "all") && (
						<div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
							<span>
								Showing {filteredTasks.length} of {tasks.length}{" "}
								tasks
							</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setSearchQuery("");
									setStatusFilter("all");
									setToolFilter("all");
									setAssigneeFilter("all");
									setPriorityFilter("all");
								}}
							>
								Clear filters
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Tasks Table */}
			<Card>
				<CardHeader>
					<CardTitle>All Tasks ({filteredTasks.length})</CardTitle>
					<CardDescription>
						Click on any task to view details in the source tool
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					) : error ? (
						<div className="text-center py-8">
							<p className="text-destructive">{error}</p>
							<Button
								variant="outline"
								className="mt-4 bg-transparent"
								onClick={() => window.location.reload()}
							>
								Retry
							</Button>
						</div>
					) : filteredTasks.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								No tasks found matching your filters
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[40%]">
											Title
										</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Assignee</TableHead>
										<TableHead>Due Date</TableHead>
										<TableHead>Source</TableHead>
										<TableHead className="text-right">
											Actions
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredTasks.map((task) => (
										<TableRow
											key={task.id}
											className="hover:bg-muted/50"
										>
											<TableCell>
												<div>
													<p className="font-medium text-foreground">
														{task.title}
													</p>
													<p className="text-sm text-muted-foreground line-clamp-1">
														{task.description}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className={cn(
														"capitalize",
														statusColors[
															task.status
														]
													)}
												>
													{task.status.replace(
														"_",
														" "
													)}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													variant="outline"
													className={cn(
														"capitalize",
														priorityColors[
															task.priority
														]
													)}
												>
													{task.priority}
												</Badge>
											</TableCell>
											<TableCell>
												<span className="text-sm text-foreground">
													{task.assignee ||
														"Unassigned"}
												</span>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													<Calendar className="h-3 w-3" />
													{formatDate(task.dueDate)}
												</div>
											</TableCell>
											<TableCell>
												<Badge
													className={cn(
														"capitalize",
														sourceColors[
															task.source
														]
													)}
												>
													{task.source}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="sm"
													asChild
												>
													<Link
														href={task.externalUrl}
														target="_blank"
														rel="noopener noreferrer"
													>
														<ExternalLink className="h-4 w-4" />
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
