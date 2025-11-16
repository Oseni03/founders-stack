"use client";
import { useTasksStore } from "@/zustand/providers/task-store-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./sortable-item";
import { updateTask } from "@/server/categories/tasks";
import { Task } from "@/zustand/stores/task-store";
import { useParams } from "next/navigation";

// Add Task type definition if not imported
type TaskStatus = "To Do" | "In Progress" | "In Review" | "Done";

interface TaskBoardProps {
	tasks: Task[];
}

export function TaskBoard({ tasks }: TaskBoardProps) {
	const { productId } = useParams<{ productId: string }>();
	const setSelectedTask = useTasksStore((state) => state.setSelectedTask);
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const columns = [
		{
			id: "To Do",
			title: "To Do",
			tasks: tasks.filter((t) => t.status === "To Do"),
		},
		{
			id: "In Progress",
			title: "In Progress",
			tasks: tasks.filter((t) => t.status === "In Progress"),
		},
		{
			id: "In Review",
			title: "In Review",
			tasks: tasks.filter((t) => t.status === "In Review"),
		},
		{
			id: "Done",
			title: "Done",
			tasks: tasks.filter((t) => t.status === "Done"),
		},
	];

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) return;

		const taskId = active.id as string;
		const newStatus = over.data.current?.status as TaskStatus | undefined;

		if (newStatus) {
			try {
				await updateTask(taskId, productId, { status: newStatus });
				// Store will be updated via revalidation
			} catch (error) {
				console.error("Failed to update task status:", error);
			}
		}
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				{columns.map((column) => (
					<Card key={column.id} className="bg-muted/50">
						<CardContent className="p-4">
							<h3 className="mb-4 font-semibold">
								{column.title}
							</h3>
							<SortableContext
								items={column.tasks.map((t) => t.id)}
								strategy={verticalListSortingStrategy}
							>
								<div className="space-y-2">
									{column.tasks.map((task) => (
										<SortableItem
											key={task.id}
											id={task.id}
											status={column.id}
										>
											<Card
												className="cursor-pointer hover:shadow-md"
												onClick={() =>
													setSelectedTask(task)
												}
											>
												<CardContent className="p-3">
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<Badge>
																{
																	task.project
																		.name
																}
															</Badge>
															<h4 className="text-sm font-medium">
																{task.title}
															</h4>
														</div>
														<div className="flex items-center justify-between text-xs text-muted-foreground">
															<span>
																Due:{" "}
																{task.dueDate
																	? format(
																			new Date(
																				task.dueDate
																			),
																			"PPP"
																		)
																	: "N/A"}
															</span>
															<Badge
																variant={
																	task.priority ===
																	"High"
																		? "destructive"
																		: "secondary"
																}
															>
																{task.priority}
															</Badge>
														</div>
														{task.assigneeAvatar && (
															<Avatar className="h-5 w-5">
																<AvatarFallback>
																	{task
																		.assigneeName?.[0] ||
																		"?"}
																</AvatarFallback>
															</Avatar>
														)}
													</div>
												</CardContent>
											</Card>
										</SortableItem>
									))}
								</div>
							</SortableContext>
						</CardContent>
					</Card>
				))}
			</div>
		</DndContext>
	);
}
