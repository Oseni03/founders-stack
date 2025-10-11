"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import TasksTable from "@/components/tasks/tasks-table";
import { Task } from "@prisma/client";
import { taskSourceColors } from "@/lib/oauth-utils";
import { TasksFilters } from "@/components/tasks/tasks-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TaskCounts {
	github: number;
	jira: number;
	linear: number;
	asana: number;
	total: number;
}

interface ProjectCounts {
	[projectId: string]: number;
}

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
	const [selectedSource, setSelectedSource] = useState<string>("all");
	const [selectedProject, setSelectedProject] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [itemsPerPage] = useState<number>(10);
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

	// Compute baseTasks based on selectedSource and apply project filter
	useEffect(() => {
		let temp = tasks;

		if (selectedSource !== "all") {
			temp = temp.filter(
				(t) => t.sourceTool?.toLowerCase() === selectedSource
			);
		}

		if (selectedProject) {
			temp = temp.filter((t) => t.projectId === selectedProject);
		}

		setFilteredTasks(temp);
		setCurrentPage(1); // Reset to page 1 when filters change
	}, [tasks, selectedSource, selectedProject]);

	// Compute unique projects and their counts from current baseTasks
	const { uniqueProjects, projectCounts } = useMemo(() => {
		const baseTasks =
			selectedSource === "all"
				? tasks
				: tasks.filter(
						(t) => t.sourceTool?.toLowerCase() === selectedSource
					);

		const counts: ProjectCounts = baseTasks.reduce(
			(acc: ProjectCounts, t: Task) => {
				if (t.projectId) {
					acc[t.projectId] = (acc[t.projectId] || 0) + 1;
				}
				return acc;
			},
			{}
		);

		const uniques = Object.keys(counts).sort();

		return { uniqueProjects: uniques, projectCounts: counts };
	}, [tasks, selectedSource]);

	// Compute paginated tasks
	const { paginatedTasks, totalPages } = useMemo(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return {
			paginatedTasks: filteredTasks.slice(startIndex, endIndex),
			totalPages: Math.ceil(filteredTasks.length / itemsPerPage),
		};
	}, [filteredTasks, currentPage, itemsPerPage]);

	// Handle page change
	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
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

			{/* Platform/Source Badges */}
			<div className="space-y-2">
				<h2 className="text-xl font-semibold text-foreground">
					Platforms
				</h2>
				<div className="flex flex-wrap gap-3">
					<Card
						className={`flex-1 min-w-[140px] cursor-pointer ${selectedSource === "all" ? "border-primary" : ""}`}
						onClick={() => setSelectedSource("all")}
					>
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
					<Card
						className={`flex-1 min-w-[140px] cursor-pointer ${selectedSource === "github" ? "border-primary" : ""}`}
						onClick={() => setSelectedSource("github")}
					>
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
					<Card
						className={`flex-1 min-w-[140px] cursor-pointer ${selectedSource === "jira" ? "border-primary" : ""}`}
						onClick={() => setSelectedSource("jira")}
					>
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
								<Badge className={taskSourceColors.jira}>
									JR
								</Badge>
							</div>
						</CardContent>
					</Card>
					<Card
						className={`flex-1 min-w-[140px] cursor-pointer ${selectedSource === "linear" ? "border-primary" : ""}`}
						onClick={() => setSelectedSource("linear")}
					>
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
					<Card
						className={`flex-1 min-w-[140px] cursor-pointer ${selectedSource === "asana" ? "border-primary" : ""}`}
						onClick={() => setSelectedSource("asana")}
					>
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
								<Badge className={taskSourceColors.asana}>
									AS
								</Badge>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Project/Board Badges */}
			<div className="space-y-2">
				<h2 className="text-xl font-semibold text-foreground">
					Projects/Boards
				</h2>
				<div className="flex flex-wrap gap-3">
					<Card
						className={`flex-1 min-w-[140px] cursor-pointer ${selectedProject === null ? "border-primary" : ""}`}
						onClick={() => setSelectedProject(null)}
					>
						<CardContent className="p-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-muted-foreground">
										Total in Selection
									</p>
									<p className="text-2xl font-bold text-foreground">
										{selectedSource === "all"
											? taskCounts.total
											: taskCounts[
													selectedSource as keyof TaskCounts
												]}
									</p>
								</div>
								<Badge variant="outline" className="text-lg">
									All
								</Badge>
							</div>
						</CardContent>
					</Card>
					{uniqueProjects.map((project) => (
						<Card
							key={project}
							className={`flex-1 min-w-[140px] cursor-pointer ${selectedProject === project ? "border-primary" : ""}`}
							onClick={() => setSelectedProject(project)}
						>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground truncate max-w-[100px]">
											{project}
										</p>
										<p className="text-2xl font-bold text-foreground">
											{projectCounts[project]}
										</p>
									</div>
									<Badge
										variant="outline"
										className="text-lg"
									>
										PR
									</Badge>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Filters */}
			<TasksFilters
				tasks={tasks}
				filteredTasks={filteredTasks}
				setFilteredTasks={setFilteredTasks}
			/>

			{/* Pagination Controls */}
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					Showing {paginatedTasks.length} of {filteredTasks.length}{" "}
					tasks
				</p>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						aria-label="Previous page"
					>
						Previous
					</Button>
					{Array.from({ length: totalPages }, (_, i) => i + 1).map(
						(page) => (
							<Button
								key={page}
								variant={
									currentPage === page ? "default" : "outline"
								}
								size="sm"
								onClick={() => handlePageChange(page)}
								aria-label={`Go to page ${page}`}
							>
								{page}
							</Button>
						)
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						aria-label="Next page"
					>
						Next
					</Button>
				</div>
			</div>

			{/* Tasks Table */}
			<TasksTable
				tasks={paginatedTasks}
				loading={loading}
				error={error}
			/>
		</div>
	);
}
