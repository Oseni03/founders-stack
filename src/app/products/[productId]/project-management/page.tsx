import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { TaskFilterBar } from "@/components/tasks/task-filter-bar";
import { priorityColors, TaskCard } from "@/components/tasks/tasks-card";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/zustand/providers/project-store-provider";
import { Task } from "@/zustand/stores/project-store";
import { Layout, List, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";

type StatusType = "todo" | "in-progress" | "in-review" | "done";

export default function TasksProjectsPage() {
	const { productId: organizationId } = useParams<{ productId: string }>();
	const {
		tasks,
		loading,
		fetchTasks,
		viewMode,
		setViewMode,
		selectedTask,
		setSelectedTask,
		filters,
	} = useProjectStore((state) => state);

	useEffect(() => {
		fetchTasks(organizationId);
	}, [organizationId]);

	const filteredTasks = useMemo(() => {
		return tasks.filter((task) => {
			if (filters.status !== "all" && task.status !== filters.status)
				return false;
			if (
				filters.priority !== "all" &&
				task.priority !== filters.priority
			)
				return false;
			if (
				filters.search &&
				!task.title.toLowerCase().includes(filters.search.toLowerCase())
			)
				return false;
			return true;
		});
	}, [tasks, filters]);

	const groupedByStatus = useMemo(() => {
		const groups: Record<StatusType, Task[]> = {
			todo: [],
			"in-progress": [],
			"in-review": [],
			done: [],
		};
		filteredTasks.forEach((task) => {
			if (groups[task.status as StatusType])
				groups[task.status as StatusType].push(task);
		});
		return groups;
	}, [filteredTasks]);

	return (
		<div className="min-h-screen">
			<div className="p-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">Tasks & Projects</h1>
					<div className="flex items-center gap-3">
						<Button
							onClick={() => setViewMode("list")}
							className="p-2 rounded"
						>
							<List className="h-5 w-5" />
						</Button>
						<Button
							onClick={() => setViewMode("board")}
							className="p-2 rounded"
						>
							<Layout className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</div>

			<TaskFilterBar />

			{loading ? (
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-12 w-12"></div>
				</div>
			) : (
				<div className="p-6">
					{viewMode === "list" && (
						<div className="grid gap-4">
							{filteredTasks.length === 0 ? (
								<div className="text-center py-12">
									<p>No tasks found</p>
								</div>
							) : (
								filteredTasks.map((task) => (
									<TaskCard
										key={task.id}
										task={task}
										onClick={setSelectedTask}
									/>
								))
							)}
						</div>
					)}

					{viewMode === "board" && (
						<div className="grid grid-cols-4 gap-4">
							{Object.entries(groupedByStatus).map(
								([status, tasks]) => (
									<div
										key={status}
										className="rounded-lg p-4"
									>
										<div className="flex items-center justify-between mb-4">
											<h3 className="font-semibold capitalize">
												{status.replace("-", " ")}
											</h3>
											<span className="text-sm">
												{tasks.length}
											</span>
										</div>
										<div className="space-y-3">
											{tasks.map((task) => (
												<div
													key={task.id}
													onClick={() =>
														setSelectedTask(task)
													}
													className="rounded-lg p-3 cursor-pointer"
												>
													<div className="flex items-center gap-2 mb-2">
														<span className="text-xs font-mono">
															{task.externalId}
														</span>
														<span
															className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[task.priority || "low"]}`}
														>
															{task.priority}
														</span>
													</div>
													<h4 className="font-medium text-sm mb-2">
														{task.title}
													</h4>
													<div className="flex items-center gap-2 text-xs">
														<User className="h-3 w-3" />
														<span>
															{task.assignee
																?.name ||
																"Unassigned"}
														</span>
													</div>
												</div>
											))}
										</div>
									</div>
								)
							)}
						</div>
					)}
				</div>
			)}

			{selectedTask && (
				<TaskDetailPanel
					task={selectedTask}
					onClose={() => setSelectedTask(null)}
				/>
			)}
		</div>
	);
}
