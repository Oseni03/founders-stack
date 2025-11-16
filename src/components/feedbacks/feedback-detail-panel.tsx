"use client";
import { useFeedbackStore } from "@/zustand/providers/feedback-store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
	updateFeedbackStatus,
	assignFeedback,
	addComment,
	linkToJira,
} from "@/server/categories/feedbacks";
import { useState } from "react";

export function FeedbackDetailPanel({ productId }: { productId: string }) {
	const { selectedFeedback } = useFeedbackStore((state) => ({
		selectedFeedback: state.selectedFeedback,
	}));
	const [comment, setComment] = useState("");
	const [jiraTicket, setJiraTicket] = useState("");

	if (!selectedFeedback) {
		return (
			<Card className="w-full lg:w-1/3">
				<CardContent className="pt-6">
					<p className="text-muted-foreground">
						Select a feedback item to view details.
					</p>
				</CardContent>
			</Card>
		);
	}

	const handleStatusChange = async (status: string) => {
		await updateFeedbackStatus(selectedFeedback.id, status);
	};

	const handleAssign = async (assignedTo: string) => {
		await assignFeedback(selectedFeedback.id, assignedTo);
	};

	const handleCommentSubmit = async () => {
		if (comment.trim()) {
			await addComment(productId, selectedFeedback.id, comment);
			setComment("");
		}
	};

	const handleJiraLink = async () => {
		if (jiraTicket.trim()) {
			await linkToJira(selectedFeedback.id, jiraTicket);
			setJiraTicket("");
		}
	};

	return (
		<Card className="w-full lg:w-1/3">
			<CardHeader>
				<CardTitle>{selectedFeedback.title}</CardTitle>
				<div className="flex gap-2">
					<Badge>{selectedFeedback.platform}</Badge>
					<Badge>{selectedFeedback.sentiment}</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				<div>
					<h3 className="text-sm font-semibold">Status</h3>
					<Select
						defaultValue={selectedFeedback.status}
						onValueChange={handleStatusChange}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="NEW">New</SelectItem>
							<SelectItem value="TRIAGED">Triaged</SelectItem>
							<SelectItem value="IN_PROGRESS">
								In Progress
							</SelectItem>
							<SelectItem value="RESOLVED">Resolved</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div>
					<h3 className="text-sm font-semibold">Priority</h3>
					<Select
						defaultValue={selectedFeedback.priority || "MEDIUM"}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="LOW">Low</SelectItem>
							<SelectItem value="MEDIUM">Medium</SelectItem>
							<SelectItem value="HIGH">High</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div>
					<h3 className="text-sm font-semibold">User Info</h3>
					<p className="text-sm">{selectedFeedback.userName}</p>
					<p className="text-sm text-muted-foreground">
						{selectedFeedback.userEmail}
					</p>
					<p className="text-sm">
						Segment: {selectedFeedback.userSegment}
					</p>
				</div>

				<div>
					<h3 className="text-sm font-semibold">Feedback Content</h3>
					<p className="text-sm">{selectedFeedback.description}</p>
					{selectedFeedback.url && (
						<a
							href={selectedFeedback.url}
							className="text-sm text-primary"
						>
							View original
						</a>
					)}
				</div>

				<div>
					<h3 className="text-sm font-semibold">Add Comment</h3>
					<Textarea
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						placeholder="Add a comment..."
					/>
					<Button onClick={handleCommentSubmit} className="mt-2">
						Submit Comment
					</Button>
				</div>

				<div>
					<h3 className="text-sm font-semibold">Link to Jira</h3>
					<Input
						value={jiraTicket}
						onChange={(e) => setJiraTicket(e.target.value)}
						placeholder="JIRA-123"
					/>
					<Button onClick={handleJiraLink} className="mt-2">
						Link Ticket
					</Button>
				</div>

				<div>
					<h3 className="text-sm font-semibold">Related Items</h3>
					{selectedFeedback.linkedItems.map((item) => (
						<p key={item.id} className="text-sm">
							{item.sourceType}: {item.targetType}
						</p>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
