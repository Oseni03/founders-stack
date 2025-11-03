import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Calendar, ChevronRight } from "lucide-react";
import { ProjectMetrics } from "@/zustand/stores/project-store";

export function TasksCard({ tasks }: { tasks: ProjectMetrics["tasks"] }) {
	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>All Tasks</CardTitle>
				<CardDescription>
					Your tasks, prioritized by urgency and due date
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="max-h-96 overflow-y-auto space-y-3">
					{tasks.length === 0 ? (
						<p className="text-muted-foreground text-center">
							No tasks found. Add a task to get started!
						</p>
					) : (
						tasks.map((task) => (
							<div
								key={task.id}
								className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted transition-colors"
							>
								<div className="flex-1">
									<p className="font-medium text-foreground">
										{task.title}
									</p>
									<p className="text-sm text-muted-foreground flex items-center gap-1">
										<Calendar className="h-4 w-4" />
										Due:{" "}
										{task.dueDate
											? new Date(
													task.dueDate
												).toLocaleDateString()
											: "No due date"}
									</p>
									{task.status && (
										<p className="text-sm text-muted-foreground">
											Status:{" "}
											{task.status
												.charAt(0)
												.toUpperCase() +
												task.status.slice(1)}
										</p>
									)}
								</div>
								<div className="flex items-center gap-2">
									<span
										className={`rounded-full px-3 py-1 text-xs font-semibold ${
											task.priority === "urgent"
												? "bg-red-100 text-red-700"
												: task.priority === "high"
													? "bg-orange-100 text-orange-700"
													: task.priority === "medium"
														? "bg-yellow-100 text-yellow-700"
														: "bg-blue-100 text-blue-700"
										}`}
									>
										{task.priority.toUpperCase()}
									</span>
									<ChevronRight className="h-5 w-5 text-muted-foreground" />
								</div>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}
