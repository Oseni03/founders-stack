"use client";
import { useTasksStore } from "@/zustand/providers/task-store-provider";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { TaskFilters as TaskFiltersType } from "@/zustand/stores/task-store";

export function TaskFilters() {
	const { filters, setFilters, viewMode, setViewMode } = useTasksStore(
		(state) => ({
			filters: state.filters,
			setFilters: state.setFilters,
			viewMode: state.viewMode,
			setViewMode: state.setViewMode,
		})
	);

	return (
		<div className="flex flex-wrap gap-4">
			<Select
				value={filters.view}
				onValueChange={(value) =>
					setFilters({ view: value as TaskFiltersType["view"] })
				}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Select view" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="my-tasks">My Tasks</SelectItem>
					<SelectItem value="team-tasks">Team Tasks</SelectItem>
					<SelectItem value="all-projects">All Projects</SelectItem>
					<SelectItem value="sprints">Sprints</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.status[0] || "all"}
				onValueChange={(value) =>
					setFilters({ status: value === "all" ? [] : [value] })
				}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Statuses</SelectItem>
					<SelectItem value="To Do">To Do</SelectItem>
					<SelectItem value="In Progress">In Progress</SelectItem>
					<SelectItem value="Done">Done</SelectItem>
					<SelectItem value="Blocked">Blocked</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.priority[0] || "all"}
				onValueChange={(value) =>
					setFilters({ priority: value === "all" ? [] : [value] })
				}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Priority" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Priorities</SelectItem>
					<SelectItem value="High">High</SelectItem>
					<SelectItem value="Medium">Medium</SelectItem>
					<SelectItem value="Low">Low</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.dateRange}
				onValueChange={(value) =>
					setFilters({
						dateRange: value as TaskFiltersType["dateRange"],
					})
				}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Date Range" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="week">Due This Week</SelectItem>
					<SelectItem value="month">Due This Month</SelectItem>
					<SelectItem value="overdue">Overdue</SelectItem>
					<SelectItem value="custom">Custom Range</SelectItem>
				</SelectContent>
			</Select>

			<div className="flex gap-2">
				<Button
					variant={viewMode === "list" ? "default" : "outline"}
					onClick={() => setViewMode("list")}
				>
					List
				</Button>
				<Button
					variant={viewMode === "board" ? "default" : "outline"}
					onClick={() => setViewMode("board")}
				>
					Board
				</Button>
				<Button
					variant={viewMode === "calendar" ? "default" : "outline"}
					onClick={() => setViewMode("calendar")}
				>
					Calendar
				</Button>
				<Button
					variant={viewMode === "sprint" ? "default" : "outline"}
					onClick={() => setViewMode("sprint")}
				>
					Sprint
				</Button>
			</div>
		</div>
	);
}
