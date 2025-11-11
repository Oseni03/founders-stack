import { Calendar, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@prisma/client";

interface TaskListItemProps {
	task: Task;
	onEdit: (task: Task) => void;
	onDelete: (taskId: string) => void;
	disabled?: boolean;
}

export function TaskListItem({
	task,
	onEdit,
	onDelete,
	disabled = false,
}: TaskListItemProps) {
	return (
		<div className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted transition-colors group">
			<div className="flex-1">
				<p className="font-medium text-foreground">{task.title}</p>
				{task.description && (
					<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
						{task.description}
					</p>
				)}
				<div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
					<p className="text-sm text-muted-foreground flex items-center gap-1">
						<Calendar className="h-4 w-4" />
						Due:{" "}
						{task.dueDate
							? new Date(task.dueDate).toLocaleDateString()
							: "No due date"}
					</p>
					{task.status && (
						<p className="text-sm text-muted-foreground">
							Status:{" "}
							{task.status.charAt(0).toUpperCase() +
								task.status.slice(1).replace("_", " ")}
						</p>
					)}
					{task.assignee && (
						<p className="text-sm text-muted-foreground">
							Assignee: {task.assignee}
						</p>
					)}
				</div>
				{task.labels && task.labels.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-2">
						{task.labels.map((label, idx) => (
							<span
								key={idx}
								className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded"
							>
								{label}
							</span>
						))}
					</div>
				)}
			</div>
			<div className="flex items-center gap-2 ml-4">
				<span
					className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
						task.priority === "urgent"
							? "bg-red-100 text-red-700"
							: task.priority === "high"
								? "bg-orange-100 text-orange-700"
								: task.priority === "medium"
									? "bg-yellow-100 text-yellow-700"
									: "bg-blue-100 text-blue-700"
					}`}
				>
					{task.priority?.toUpperCase()}
				</span>
				<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onEdit(task)}
						disabled={disabled}
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onDelete(task.id)}
						disabled={disabled}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
				<ChevronRight className="h-5 w-5 text-muted-foreground" />
			</div>
		</div>
	);
}
