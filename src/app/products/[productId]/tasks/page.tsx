import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskList } from "@/components/tasks/task-list";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskCalendar } from "@/components/tasks/task-calendar";
import { TaskSprint } from "@/components/tasks/task-sprint";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { useTasksStore } from "@/zustand/providers/task-store-provider";
import { Card } from "@/components/ui/card";
import { fetchTasks } from "@/server/categories/tasks";
import { Task } from "@/zustand/stores/task-store";

export default async function TasksPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;
	// Server-side data fetching
	const tasks = await fetchTasks({ organizationId: productId });

	return (
		<div className="space-y-6">
			<TaskFilters />
			<Card className="p-4">
				<ViewRenderer tasks={tasks} />
			</Card>
			<TaskDetailPanel />
		</div>
	);
}

function ViewRenderer({ tasks }: { tasks: Task[] }) {
	const viewMode = useTasksStore((state) => state.viewMode);

	switch (viewMode) {
		case "board":
			return <TaskBoard tasks={tasks} />;
		case "calendar":
			return <TaskCalendar tasks={tasks} />;
		case "sprint":
			return <TaskSprint tasks={tasks} />;
		default:
			return <TaskList tasks={tasks} />;
	}
}
