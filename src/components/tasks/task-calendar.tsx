"use client";
import { useTasksStore } from "@/zustand/providers/task-store-provider";
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/zustand/stores/task-store";
import { cn } from "@/lib/utils";

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales: { "en-US": enUS },
});

interface TaskCalendarProps {
	tasks: Task[];
}

interface CalendarEvent extends Event {
	id: string;
	title: string;
	resource: Task;
}

export function TaskCalendar({ tasks }: TaskCalendarProps) {
	const setSelectedTask = useTasksStore((state) => state.setSelectedTask);

	const events: CalendarEvent[] = tasks
		.filter((task) => task.dueDate)
		.map((task) => ({
			id: task.id,
			title: task.title,
			start: new Date(task.dueDate!),
			end: new Date(task.dueDate!),
			resource: task,
		}));

	const eventPropGetter = (event: CalendarEvent) => {
		const priority = event.resource.priority;
		return {
			className: cn(
				priority === "High" && "bg-destructive text-white",
				priority === "Medium" && "bg-primary text-white",
				priority === "Low" && "bg-secondary text-foreground"
			),
		};
	};

	return (
		<Card className="p-4">
			<Calendar
				localizer={localizer}
				events={events}
				startAccessor="start"
				endAccessor="end"
				style={{ height: 600 }}
				onSelectEvent={(event: CalendarEvent) =>
					setSelectedTask(event.resource)
				}
				eventPropGetter={eventPropGetter}
				views={["month", "week"]}
				defaultView="month"
				components={{
					event: ({ event }: { event: CalendarEvent }) => (
						<div className="flex items-center gap-1">
							<Badge>{event.resource.project.name}</Badge>
							<span>{event.title}</span>
						</div>
					),
				}}
			/>
		</Card>
	);
}
