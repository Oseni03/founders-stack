"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboardStore } from "@/zustand/providers/dashboard-store-provider";
import { Task } from "@prisma/client";

interface SprintStatusWidgetProps {
	initialData: {
		progress: number;
		tasks: { done: number; inProgress: number; toDo: number };
		blockers: Task[];
	};
}

export function SprintStatusWidget({ initialData }: SprintStatusWidgetProps) {
	const { sprintStatus, setSprintStatus } = useDashboardStore((state) => ({
		sprintStatus: state.sprintStatus,
		setSprintStatus: state.setSprintStatus,
	}));

	// Initialize with server data
	setSprintStatus(initialData);

	return (
		<Card className="shadow-sm">
			<CardHeader>
				<CardTitle>Active Sprint</CardTitle>
			</CardHeader>
			<CardContent>
				<Progress value={sprintStatus.progress} className="mb-4" />
				<div className="space-y-2">
					<div>Done: {sprintStatus.tasks.done}</div>
					<div>In Progress: {sprintStatus.tasks.inProgress}</div>
					<div>To Do: {sprintStatus.tasks.toDo}</div>
					{sprintStatus.blockers.length > 0 && (
						<div className="text-red-500">
							Blockers: {sprintStatus.blockers.length}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
