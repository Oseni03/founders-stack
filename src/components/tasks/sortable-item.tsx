"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
	id: string;
	status: string;
	children: React.ReactNode;
}

export function SortableItem({ id, status, children }: SortableItemProps) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			data-status={status}
		>
			{children}
		</div>
	);
}
