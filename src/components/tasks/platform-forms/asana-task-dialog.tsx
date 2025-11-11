import { useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TaskFormData } from "@/zustand/stores/project-store";
import { Project, Task } from "@prisma/client";

const asanaTaskSchema = z.object({
	title: z.string().min(1, "Title is required").max(200, "Title is too long"),
	description: z.string().optional().default(""),
	assigneeId: z.string().optional().default(""),
	dueDate: z.string().optional().default(""),
	priority: z.enum(["low", "medium", "high", "urgent"]).nullable(),
	labels: z.array(z.string()).default([]),
	completed: z.boolean().default(false),
	projectId: z.string().min(1, "Project is required"),
});

type AsanaTaskFormValues = z.infer<typeof asanaTaskSchema>;

interface AsanaTaskDialogProps {
	open: boolean;
	onClose: () => void;
	editingTask: Task | null;
	projects: Project[];
	onCreate: (data: TaskFormData) => Promise<void>;
	onUpdate: (taskId: string, data: TaskFormData) => Promise<void>;
	loading: boolean;
}

export function AsanaTaskDialog({
	open,
	onClose,
	editingTask,
	projects,
	onCreate,
	onUpdate,
	loading,
}: AsanaTaskDialogProps) {
	const form = useForm<AsanaTaskFormValues>({
		resolver: zodResolver(
			asanaTaskSchema
		) as unknown as Resolver<AsanaTaskFormValues>,
		defaultValues: {
			title: "",
			description: "",
			assigneeId: "",
			dueDate: "",
			priority: null,
			labels: [],
			completed: false,
			projectId: "",
		},
	});

	useEffect(() => {
		if (editingTask) {
			form.reset({
				title: editingTask.title,
				description: editingTask.description || "",
				assigneeId: editingTask.assigneeId || "",
				dueDate: editingTask.dueDate
					? new Date(editingTask.dueDate).toISOString().split("T")[0]
					: "",
				priority: editingTask.priority,
				labels: editingTask.labels || [],
				completed: editingTask.status === "done",
				projectId: editingTask.projectId,
			});
		} else {
			form.reset({
				title: "",
				description: "",
				assigneeId: "",
				dueDate: "",
				priority: null,
				labels: [],
				completed: false,
				projectId: "",
			});
		}
	}, [editingTask, form]);

	const handleSubmit = async (formData: AsanaTaskFormValues) => {
		try {
			const taskData: TaskFormData = {
				title: formData.title,
				description: formData.description,
				status: formData.completed ? "done" : "open",
				priority: formData.priority,
				assignee: formData.assigneeId,
				dueDate: formData.dueDate || undefined,
				projectId: formData.projectId,
				labels: formData.labels,
			};

			if (editingTask?.id) {
				await onUpdate(editingTask.id, taskData);
			} else {
				await onCreate(taskData);
			}
			onClose();
		} catch (error) {
			console.error("Error submitting Asana task:", error);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingTask ? "Edit Asana Task" : "Create Asana Task"}
					</DialogTitle>
					<DialogDescription>
						{editingTask
							? "Update the task details. Changes will sync to Asana."
							: "Create a new task in Asana."}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<div className="space-y-4 py-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title *</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter task title"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Enter task description"
											rows={4}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="projectId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Project *</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select project" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{projects.map((project) => (
													<SelectItem
														key={project.id}
														value={project.id}
													>
														{project.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="assigneeId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Assignee ID</FormLabel>
										<FormControl>
											<Input
												placeholder="Enter assignee ID"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="priority"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Priority</FormLabel>
										<Select
											onValueChange={(value) =>
												field.onChange(value || null)
											}
											value={field.value || undefined}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select priority" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="low">
													Low
												</SelectItem>
												<SelectItem value="medium">
													Medium
												</SelectItem>
												<SelectItem value="high">
													High
												</SelectItem>
												<SelectItem value="urgent">
													Urgent
												</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="dueDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Due Date</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="labels"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Labels</FormLabel>
									<FormControl>
										<Input
											placeholder="bug, feature, urgent"
											value={field.value.join(", ")}
											onChange={(e) => {
												const labels = e.target.value
													.split(",")
													.map((l) => l.trim())
													.filter(Boolean);
												field.onChange(labels);
											}}
										/>
									</FormControl>
									<FormDescription>
										Enter labels separated by commas
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="completed"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>Mark as completed</FormLabel>
										<FormDescription>
											Check this box if the task is
											already completed
										</FormDescription>
									</div>
								</FormItem>
							)}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={form.handleSubmit(handleSubmit)}
							disabled={loading}
						>
							{loading && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{editingTask ? "Update Task" : "Create Task"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
