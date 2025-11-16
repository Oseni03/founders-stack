"use client";
import { useTasksStore } from "@/zustand/providers/task-store-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useState } from "react";
import { addComment } from "@/server/categories/tasks";
import { useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Badge } from "../ui/badge";

export function TaskDetailPanel() {
	const { productId } = useParams<{ productId: string }>();
	const { selectedTask, setSelectedTask } = useTasksStore((state) => ({
		selectedTask: state.selectedTask,
		setSelectedTask: state.setSelectedTask,
	}));
	const { data: session } = authClient.useSession();
	const [comment, setComment] = useState("");

	if (!selectedTask) return null;

	const handleAddComment = async () => {
		if (!comment.trim()) return;
		if (!session?.user.id) return;
		try {
			await addComment(
				productId,
				selectedTask.id,
				comment,
				session.user.id
			); // Replace with actual user ID
			setComment("");
			// Refetch task or update locally
		} catch (error) {
			console.error("Failed to add comment:", error);
		}
	};

	return (
		<div className="fixed right-0 top-0 h-screen w-[400px] bg-background shadow-lg">
			<Card className="h-full border-0">
				<CardHeader>
					<CardTitle>
						{selectedTask.title}{" "}
						<Badge>{selectedTask.project.name}</Badge>
					</CardTitle>
					<Button
						variant="ghost"
						onClick={() => setSelectedTask(null)}
					>
						Close
					</Button>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<p className="text-sm text-muted-foreground">
							Status: {selectedTask.status}
						</p>
						<p className="text-sm text-muted-foreground">
							Due:{" "}
							{selectedTask.dueDate
								? format(new Date(selectedTask.dueDate), "PPP")
								: "N/A"}
						</p>
						<p className="text-sm text-muted-foreground">
							Assignee: {selectedTask.assigneeName}
						</p>
					</div>
					<div>
						<h4 className="font-semibold">Description</h4>
						<p>{selectedTask.description || "No description"}</p>
					</div>
					<div>
						<h4 className="font-semibold">Linked Items</h4>
						{selectedTask.linkedItems?.map((item) => (
							<p key={item.id} className="text-sm">
								{item.linkType}: {item.description}
							</p>
						))}
					</div>
					<div>
						<h4 className="font-semibold">Comments</h4>
						{selectedTask.comments?.map((comment) => (
							<div key={comment.id} className="border-b py-2">
								<p className="text-sm">{comment.content}</p>
								<p className="text-xs text-muted-foreground">
									{comment.author.name} •{" "}
									{format(
										new Date(comment.createdAt),
										"PPP p"
									)}
								</p>
							</div>
						))}
						<Textarea
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="Add a comment..."
							className="mt-2"
						/>
						<Button onClick={handleAddComment} className="mt-2">
							Post Comment
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
