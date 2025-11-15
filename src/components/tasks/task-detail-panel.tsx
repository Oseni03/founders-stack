import { ExternalLink, Eye, EyeOff, Trash2, User, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Link from "next/link";
import { Task } from "@/zustand/stores/project-store";
import { useParams } from "next/navigation";
import { useProjectStore } from "@/zustand/providers/project-store-provider";
import { useState } from "react";
import { ToolBadge } from "./tool-badge";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

export const TaskDetailPanel = ({
	task,
	onClose,
}: {
	task: Task;
	onClose: () => void;
}) => {
	const { productId: organizationId } = useParams<{ productId: string }>();
	const { updateTask, deleteTask, toggleWatcher } = useProjectStore(
		(state) => state
	);
	const [isUpdating, setIsUpdating] = useState(false);

	if (!task) return null;

	const handleUpdate = async (field: string, value: string) => {
		setIsUpdating(true);
		try {
			await updateTask(organizationId, task.id, {
				[field]: value,
			});
		} catch (err) {
			console.error("Update failed:", err);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDelete = async () => {
		if (confirm("Are you sure you want to delete this task?")) {
			await deleteTask(organizationId, task.id);
			onClose();
		}
	};

	const handleToggleWatch = async () => {
		await toggleWatcher(organizationId, task.id, task.isWatching);
	};

	return (
		<div className="fixed inset-y-0 right-0 w-[600px] z-50 overflow-y-auto">
			<div className="sticky top-0 p-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<span className="text-lg font-mono">{task.externalId}</span>
					<ToolBadge tool={task.sourceTool} />
					{task.url && (
						<Link
							href={task.url}
							target="_blank"
							rel="noopener noreferrer"
						>
							<ExternalLink className="h-5 w-5" />
						</Link>
					)}
				</div>
				<Button onClick={onClose}>
					<X className="h-6 w-6" />
				</Button>
			</div>

			<div className="p-6">
				<h2 className="text-2xl font-semibold mb-6">{task.title}</h2>

				<div className="grid grid-cols-2 gap-4 mb-6">
					<div>
						<Label className="block text-sm font-medium mb-1">
							Status
						</Label>
						<Select
							value={task.status}
							onValueChange={(v) => {
								handleUpdate("status", v);
							}}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todo">To Do</SelectItem>
								<SelectItem value="in-progress">
									In Progress
								</SelectItem>
								<SelectItem value="in-review">
									In Review
								</SelectItem>
								<SelectItem value="done">Done</SelectItem>
								<SelectItem value="blocked">Blocked</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label className="block text-sm font-medium mb-1">
							Priority
						</Label>
						<Select
							value={task.priority}
							onValueChange={(v) => {
								handleUpdate("priority", v);
							}}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="high">High</SelectItem>
								<SelectItem value="critical">
									Critical
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label className="block text-sm font-medium mb-1">
							Assignee
						</Label>
						<div className="flex items-center gap-2 px-3 py-2 rounded-lg">
							<User className="h-4 w-4" />
							<span className="text-sm">
								{task.assignee?.name || "Unassigned"}
							</span>
						</div>
					</div>

					<div>
						<Label className="block text-sm font-medium mb-1">
							Due Date
						</Label>
						<Input
							type="date"
							value={task.dueDate?.split("T")[0]}
							onChange={(e) =>
								handleUpdate("dueDate", e.target.value)
							}
							disabled={isUpdating}
							className="w-full px-3 py-2 rounded-lg"
						/>
					</div>
				</div>

				<div className="mb-6">
					<h3 className="text-sm font-medium mb-2">Project</h3>
					<div className="flex items-center gap-2 text-sm">
						<span className="font-medium">{task.project.name}</span>
						<span>•</span>
						<span className="capitalize">
							{task.project.platform}
						</span>
					</div>
				</div>

				<div className="mb-6">
					<h3 className="text-sm font-medium mb-2">Description</h3>
					<p>{task.description || "No description"}</p>
				</div>

				{task.labels && task.labels.length > 0 && (
					<div className="mb-6">
						<h3 className="text-sm font-medium mb-2">Labels</h3>
						<div className="flex flex-wrap gap-2">
							{task.labels.map((label) => (
								<span
									key={label}
									className="px-3 py-1 rounded-full text-sm"
								>
									{label}
								</span>
							))}
						</div>
					</div>
				)}

				{task.storyPoints && (
					<div className="mb-6">
						<h3 className="text-sm font-medium mb-2">
							Story Points
						</h3>
						<span className="text-2xl font-bold">
							{task.storyPoints}
						</span>
					</div>
				)}

				<div className="pt-6 mt-6">
					<div className="flex gap-2">
						<Button
							onClick={handleToggleWatch}
							className="flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
						>
							{task.isWatching ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
							{task.isWatching ? "Unwatch" : "Watch"}
						</Button>
						<Button className="flex-1 px-4 py-2 rounded-lg">
							Link Item
						</Button>
						<Button
							onClick={handleDelete}
							className="px-4 py-2 rounded-lg flex items-center gap-2"
						>
							<Trash2 className="h-4 w-4" />
							Delete
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
