"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
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
import { Filter, Search } from "lucide-react";
import { Task } from "@prisma/client";

export const TasksFilters = (props: {
	tasks: Task[];
	filteredTasks: Task[];
	setFilteredTasks: Dispatch<SetStateAction<Task[]>>;
}) => {
	// Filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [toolFilter, setToolFilter] = useState<string>("all");
	const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
	const [priorityFilter, setPriorityFilter] = useState<string>("all");

	// Apply filters
	useEffect(() => {
		let filtered = [...props.tasks];

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
			filtered = filtered.filter(
				(task) => task.sourceTool === toolFilter
			);
		}

		// Assignee filter
		if (assigneeFilter !== "all") {
			filtered = filtered.filter(
				(task) => task.assigneeId === assigneeFilter
			);
		}

		// Priority filter
		if (priorityFilter !== "all") {
			filtered = filtered.filter(
				(task) => task.priority === priorityFilter
			);
		}

		props.setFilteredTasks(filtered);
	}, [
		searchQuery,
		statusFilter,
		toolFilter,
		assigneeFilter,
		priorityFilter,
		props,
	]);

	// Get unique assignees
	const uniqueAssignees = Array.from(
		new Set(props.tasks.map((task) => task.assigneeId).filter(Boolean))
	);
	return (
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
								onChange={(e) => setSearchQuery(e.target.value)}
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
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="open">Open</SelectItem>
							<SelectItem value="in_progress">
								In Progress
							</SelectItem>
							<SelectItem value="done">Done</SelectItem>
							<SelectItem value="blocked">Blocked</SelectItem>
						</SelectContent>
					</Select>

					{/* Tool Filter */}
					<Select value={toolFilter} onValueChange={setToolFilter}>
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
							<SelectItem value="all">All Priorities</SelectItem>
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
							<SelectItem value="all">All Assignees</SelectItem>
							{uniqueAssignees.map((assignee) => (
								<SelectItem key={assignee} value={assignee!}>
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
							Showing {props.filteredTasks.length} of{" "}
							{props.tasks.length} tasks
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
	);
};
