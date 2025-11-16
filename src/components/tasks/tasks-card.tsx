import { Task } from "@/zustand/stores/task-store";
import { ToolBadge } from "./tool-badge";
import {
	AlertCircle,
	Calendar,
	Eye,
	MessageSquare,
	Paperclip,
	User,
} from "lucide-react";

export const priorityColors: { [key: string]: string } = {
	critical: "bg-red-100 text-red-800 border-red-300",
	high: "bg-orange-100 text-orange-800 border-orange-300",
	medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
	low: "bg-green-100 text-green-800 border-green-300",
};

const statusColors: { [key: string]: string } = {
	todo: "bg-gray-100 text-gray-800",
	"in-progress": "bg-blue-100 text-blue-800",
	"in-review": "bg-purple-100 text-purple-800",
	blocked: "bg-red-100 text-red-800",
	done: "bg-green-100 text-green-800",
};

export const TaskCard = ({
	task,
	onClick,
}: {
	task: Task;
	onClick: (task: Task) => void;
}) => {
	const isOverdue =
		task.dueDate &&
		new Date(task.dueDate) < new Date() &&
		task.status !== "done";
	const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
	const dueDateStr = dueDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});

	return (
		<div
			onClick={() => onClick(task)}
			className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
		>
			<div className="flex items-start justify-between mb-2">
				<div className="flex items-center gap-2">
					<span className="text-sm font-mono text-gray-500">
						{task.externalId}
					</span>
					<ToolBadge tool={task.sourceTool} />
				</div>
				<span
					className={`text-xs px-2 py-1 rounded-full font-medium ${task.priority && priorityColors[task.priority]}`}
				>
					{task.priority}
				</span>
			</div>

			<h3 className="font-medium text-gray-900 mb-2">{task.title}</h3>

			<div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
				<span
					className={`px-2 py-1 rounded ${statusColors[task.status]}`}
				>
					{task.status.replace("-", " ")}
				</span>
				{isOverdue && (
					<span className="flex items-center gap-1 text-red-600">
						<AlertCircle className="h-4 w-4" />
						Overdue
					</span>
				)}
				<span className="flex items-center gap-1">
					<Calendar className="h-4 w-4" />
					{dueDateStr}
				</span>
				<span className="flex items-center gap-1">
					<User className="h-4 w-4" />
					{task.assignee?.name || "Unassigned"}
				</span>
			</div>

			{task.labels && task.labels.length > 0 && (
				<div className="flex gap-2 mt-2">
					{task.labels.map((label) => (
						<span
							key={label}
							className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
						>
							{label}
						</span>
					))}
				</div>
			)}

			<div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
				{task.commentsCount > 0 && (
					<span className="flex items-center gap-1">
						<MessageSquare className="h-4 w-4" />
						{task.commentsCount}
					</span>
				)}
				{task.linkedItemsCount > 0 && (
					<span className="flex items-center gap-1">
						<Paperclip className="h-4 w-4" />
						{task.linkedItemsCount}
					</span>
				)}
				{task.dependencies.length > 0 && (
					<span className="flex items-center gap-1 text-red-600">
						<AlertCircle className="h-4 w-4" />
						Blocked by {task.dependencies[0]}
					</span>
				)}
				{task.isWatching && (
					<span className="flex items-center gap-1 text-blue-600">
						<Eye className="h-4 w-4" />
						Watching
					</span>
				)}
			</div>
		</div>
	);
};
