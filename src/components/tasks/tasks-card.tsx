import { useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useProjectStore } from "@/zustand/providers/project-store-provider";
import { useIntegrationsStore } from "@/zustand/providers/integrations-store-provider";
import { Task } from "@prisma/client";
import { TaskListItem } from "./task-list";
import { AsanaTaskDialog } from "./platform-forms/asana-task-dialog";
import { JiraTaskDialog } from "./platform-forms/jira-task-dialog";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { useParams } from "next/navigation";

export function TasksCard() {
	const { productId } = useParams();
	const [isPlatformSelectOpen, setIsPlatformSelectOpen] = useState(false);
	const [selectedPlatform, setSelectedPlatform] = useState<string | null>(
		null
	);
	const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

	const {
		data,
		projects,
		loading,
		error,
		createTask,
		updateTask,
		deleteTask,
	} = useProjectStore((state) => state);

	const { integrations } = useIntegrationsStore((state) => state);

	// Filter project management integrations
	const projectManagementIntegrations = integrations.filter(
		(integration) =>
			integration.category === "PROJECT_MGMT" &&
			integration.status === "CONNECTED"
	);

	const handleAddTaskClick = () => {
		if (projectManagementIntegrations.length === 0) {
			return;
		}
		if (projectManagementIntegrations.length === 1) {
			// Auto-select if only one integration
			setSelectedPlatform(
				projectManagementIntegrations[0].toolName.toLowerCase()
			);
			setIsTaskDialogOpen(true);
		} else {
			// Show platform selector
			setIsPlatformSelectOpen(true);
		}
	};

	const handlePlatformSelect = (platform: string) => {
		setSelectedPlatform(platform);
		setIsPlatformSelectOpen(false);
		setIsTaskDialogOpen(true);
	};

	const handleEditTask = (task: Task) => {
		setEditingTask(task);
		setSelectedPlatform(task.sourceTool?.toLowerCase() || null);
		setIsTaskDialogOpen(true);
	};

	const handleCloseTaskDialog = () => {
		setIsTaskDialogOpen(false);
		setEditingTask(null);
		setSelectedPlatform(null);
	};

	const handleDeleteClick = (taskId: string) => {
		setTaskToDelete(taskId);
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!taskToDelete) return;
		try {
			await deleteTask(productId as string, taskToDelete);
			setIsDeleteDialogOpen(false);
			setTaskToDelete(null);
		} catch (error) {
			console.error("Error deleting task:", error);
		}
	};

	const tasks = data?.tasks || [];

	return (
		<>
			<Card className="mb-8">
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>All Tasks</CardTitle>
							<CardDescription>
								Your tasks, prioritized by urgency and due date
							</CardDescription>
						</div>
						<Button
							onClick={handleAddTaskClick}
							size="sm"
							disabled={
								projectManagementIntegrations.length === 0
							}
						>
							<Plus className="h-4 w-4 mr-2" />
							Add Task
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
							{error}
						</div>
					)}

					{projectManagementIntegrations.length === 0 && !loading && (
						<div className="text-center py-8 text-muted-foreground">
							No project management integrations found. Please
							connect Jira, Asana, or another PM tool first.
						</div>
					)}

					<div className="max-h-96 overflow-y-auto space-y-3">
						{loading && tasks.length === 0 ? (
							<div className="flex justify-center items-center py-8">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						) : tasks.length === 0 ? (
							<p className="text-muted-foreground text-center py-8">
								No tasks found. Add a task to get started!
							</p>
						) : (
							tasks.map((task) => (
								<TaskListItem
									key={task.id}
									task={task}
									onEdit={handleEditTask}
									onDelete={handleDeleteClick}
									disabled={loading}
								/>
							))
						)}
					</div>
				</CardContent>
			</Card>

			{/* Platform Selection Dialog */}
			<Dialog
				open={isPlatformSelectOpen}
				onOpenChange={setIsPlatformSelectOpen}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Select Platform</DialogTitle>
						<DialogDescription>
							Choose which platform to create the task in
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Platform</Label>
							<Select onValueChange={handlePlatformSelect}>
								<SelectTrigger>
									<SelectValue placeholder="Select a platform" />
								</SelectTrigger>
								<SelectContent>
									{projectManagementIntegrations.map(
										(integration) => (
											<SelectItem
												key={integration.id}
												value={integration.toolName.toLowerCase()}
											>
												{integration.toolName}
											</SelectItem>
										)
									)}
								</SelectContent>
							</Select>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Platform-Specific Task Dialogs */}
			{selectedPlatform === "asana" && (
				<AsanaTaskDialog
					open={isTaskDialogOpen}
					onClose={handleCloseTaskDialog}
					editingTask={editingTask}
					projects={projects.filter((p) => p.sourceTool === "asana")}
					onCreate={createTask}
					onUpdate={updateTask}
					loading={loading}
				/>
			)}

			{selectedPlatform === "jira" && (
				<JiraTaskDialog
					open={isTaskDialogOpen}
					onClose={handleCloseTaskDialog}
					editingTask={editingTask}
					projects={projects.filter((p) => p.sourceTool === "jira")}
					onCreate={createTask}
					onUpdate={updateTask}
					loading={loading}
				/>
			)}

			{/* Delete Confirmation Dialog */}
			<DeleteTaskDialog
				open={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				onConfirm={handleDeleteConfirm}
				loading={loading}
			/>
		</>
	);
}
