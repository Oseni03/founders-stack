import React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Task } from "@prisma/client";
import { taskSourceColors } from "@/lib/oauth-utils";

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

const TasksTable = (props: {
	tasks: Task[];
	loading: boolean;
	error: string | null;
}) => {
	const formatDate = (date: Date | null) => {
		if (!date) return "No due date";
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>All Tasks ({props.tasks.length})</CardTitle>
				<CardDescription>
					Click on any task to view details in the source tool
				</CardDescription>
			</CardHeader>
			<CardContent>
				{props.loading ? (
					<div className="space-y-3">
						{[...Array(5)].map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>
				) : props.error ? (
					<div className="text-center py-8">
						<p className="text-destructive">{props.error}</p>
						<Button
							variant="outline"
							className="mt-4 bg-transparent"
							onClick={() => window.location.reload()}
						>
							Retry
						</Button>
					</div>
				) : props.tasks.length === 0 ? (
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
								{props.tasks.map((task) => (
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
													statusColors[task.status]
												)}
											>
												{task.status.replace("_", " ")}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={cn(
													"capitalize",
													priorityColors[
														task.priority!
													]
												)}
											>
												{task.priority}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="text-sm text-foreground">
												{task.assignee || "Unassigned"}
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
													taskSourceColors[
														task.sourceTool as keyof typeof taskSourceColors
													] ?? ""
												)}
											>
												{task.sourceTool}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												asChild
											>
												<Link
													href={task.url || "#"}
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
	);
};

export default TasksTable;
