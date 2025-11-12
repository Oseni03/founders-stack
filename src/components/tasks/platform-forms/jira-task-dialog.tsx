/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TaskFormData } from "@/zustand/stores/project-store";
import { Project, Task } from "@prisma/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

const jiraTaskSchema = z.object({
	issueType: z.string().min(1, "Issue type is required"),
	title: z.string().min(1, "Title is required").max(200, "Title is too long"),
	description: z.string().optional().default(""),
	assigneeId: z.string().optional().default(""),
	dueDate: z.string().optional().default(""),
	priority: z.enum(["low", "medium", "high", "urgent"]).nullable(),
	labels: z.array(z.string()).default([]),
	projectId: z.string().min(1, "Project is required"),
});

type JiraTaskFormValues = z.infer<typeof jiraTaskSchema>;

interface JiraTaskDialogProps {
	open: boolean;
	onClose: () => void;
	editingTask: Task | null;
	projects: Project[];
	onCreate: (data: TaskFormData) => Promise<void>;
	onUpdate: (taskId: string, data: TaskFormData) => Promise<void>;
	loading: boolean;
}

export function JiraTaskDialog({
	open,
	onClose,
	editingTask,
	projects,
	onCreate,
	onUpdate,
	loading,
}: JiraTaskDialogProps) {
	const form = useForm<JiraTaskFormValues>({
		resolver: zodResolver(jiraTaskSchema) as Resolver<JiraTaskFormValues>,
		defaultValues: {
			issueType: "Task",
			title: "",
			description: "",
			assigneeId: "",
			dueDate: "",
			priority: null,
			labels: [],
			projectId: "",
		},
	});

	useEffect(() => {
		if (editingTask) {
			logger.debug("Jira dialog: loading issue for editing", {
				taskId: editingTask.id,
				title: editingTask.title,
			});
			form.reset({
				issueType:
					(editingTask.attributes as Record<string, any>)
						?.issueType || "Task",
				title: editingTask.title,
				description: editingTask.description || "",
				assigneeId: editingTask.assigneeId || "",
				dueDate: editingTask.dueDate
					? new Date(editingTask.dueDate).toISOString().split("T")[0]
					: "",
				priority: editingTask.priority,
				labels: editingTask.labels || [],
				projectId: editingTask.projectId,
			});
		} else {
			logger.debug("Jira dialog: opening for new issue creation");
			form.reset({
				issueType: "Task",
				title: "",
				description: "",
				assigneeId: "",
				dueDate: "",
				priority: null,
				labels: [],
				projectId: "",
			});
		}
	}, [editingTask, form]);

	const handleSubmit = async (formData: JiraTaskFormValues) => {
		try {
			logger.info("Jira issue form submitted", {
				mode: editingTask ? "edit" : "create",
				title: formData.title,
				issueType: formData.issueType,
				projectId: formData.projectId,
			});
			const taskData: TaskFormData = {
				title: formData.title,
				description: formData.description,
				status: null,
				priority: formData.priority,
				assignee: formData.assigneeId,
				dueDate: formData.dueDate || undefined,
				projectId: formData.projectId,
				labels: formData.labels,
				// Store issueType in attributes for Jira-specific data
			};

			if (editingTask?.id) {
				logger.debug("Updating Jira issue", { taskId: editingTask.id });
				await onUpdate(editingTask?.id, taskData);
				logger.info("Jira issue updated successfully", {
					taskId: editingTask.id,
				});
				toast.success("Issue updated successfully");
			} else {
				logger.debug("Creating new Jira issue", {
					issueType: formData.issueType,
				});
				await onCreate(taskData);
				logger.info("Jira issue created successfully", {
					title: formData.title,
					issueType: formData.issueType,
				});
				toast.success("Issue created successfully");
			}
			onClose();
		} catch (error) {
			logger.error("Error submitting Jira issue", {
				error,
				editingTaskId: editingTask?.id,
			});
			const errorMessage =
				error instanceof Error ? error.message : "Failed to save issue";
			toast.error(errorMessage);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingTask ? "Edit Jira Issue" : "Create Jira Issue"}
					</DialogTitle>
					<DialogDescription>
						{editingTask
							? "Update the issue details. Changes will sync to Jira."
							: "Create a new issue in Jira."}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<div className="space-y-4 py-4">
						<FormField
							control={form.control}
							name="issueType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Issue Type *</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="Task">
												Task
											</SelectItem>
											<SelectItem value="Story">
												Story
											</SelectItem>
											<SelectItem value="Bug">
												Bug
											</SelectItem>
											<SelectItem value="Epic">
												Epic
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Summary *</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter issue summary"
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
											placeholder="Enter issue description"
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
										<FormDescription>
											Jira user account ID
										</FormDescription>
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
							{editingTask ? "Update Issue" : "Create Issue"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
