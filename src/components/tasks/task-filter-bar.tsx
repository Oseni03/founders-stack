"use client";

import { useProjectStore } from "@/zustand/providers/project-store-provider";
import { Plus, Search } from "lucide-react";
import { Button } from "../ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

export const TaskFilterBar = () => {
	const { filters, setFilter } = useProjectStore((state) => state);

	return (
		<div className="p-4">
			<div className="flex flex-wrap gap-3">
				<Select
					value={filters.view}
					onValueChange={(v) => {
						setFilter("view", v);
					}}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="my-tasks">My Tasks</SelectItem>
						<SelectItem value="team-tasks">Team Tasks</SelectItem>
						<SelectItem value="all-projects">
							All Projects
						</SelectItem>
						<SelectItem value="sprints">Sprints</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={filters.status}
					onValueChange={(v) => {
						setFilter("status", v);
					}}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="todo">To Do</SelectItem>
						<SelectItem value="in-process">In Progress</SelectItem>
						<SelectItem value="in-review">In Review</SelectItem>
						<SelectItem value="blocked">Blocked</SelectItem>
						<SelectItem value="done">Done</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={filters.priority}
					onValueChange={(value) => setFilter("priority", value)}
				>
					<SelectTrigger className="w-40 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2">
						<SelectValue placeholder="Select priority" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Priority</SelectItem>
						<SelectItem value="critical">Critical</SelectItem>
						<SelectItem value="high">High</SelectItem>
						<SelectItem value="medium">Medium</SelectItem>
						<SelectItem value="low">Low</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={filters.dateRange}
					onValueChange={(value) => setFilter("dateRange", value)}
				>
					<SelectTrigger className="w-40 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2">
						<SelectValue placeholder="Select date range" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Dates</SelectItem>
						<SelectItem value="today">Due Today</SelectItem>
						<SelectItem value="week">Due This Week</SelectItem>
						<SelectItem value="month">Due This Month</SelectItem>
						<SelectItem value="overdue">Overdue</SelectItem>
					</SelectContent>
				</Select>

				<div className="ml-auto flex gap-2">
					<div className="relative">
						<Search className="absolute left-3 top-2.5 h-4 w-4" />
						<input
							type="text"
							placeholder="Search tasks..."
							value={filters.search}
							onChange={(e) =>
								setFilter("search", e.target.value)
							}
							className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 w-64"
						/>
					</div>
					<Button className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
						<Plus className="h-4 w-4" />
						New Task
					</Button>
				</div>
			</div>
		</div>
	);
};
