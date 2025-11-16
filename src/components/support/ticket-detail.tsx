// components/support/TicketDetail.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSupportStore } from "@/zustand/providers/support-store-provider";
import type { SupportTicket } from "@prisma/client";
import logger from "@/lib/logger";

interface TicketDetailProps {
	ticket: SupportTicket;
}

export default function TicketDetail({
	ticket: initialTicket,
}: TicketDetailProps) {
	const { selectedTicket, setSelectedTicket } = useSupportStore(
		(state) => state
	);

	if (!selectedTicket) setSelectedTicket(initialTicket);

	// Mock conversation; fetch real from DB/API
	const conversation = [
		{
			author: "Customer",
			time: "30 mins ago",
			message: "Issue description...",
		},
		// Add more
	];

	const handleReply = async () => {
		// Call server action: addComment
		logger.info("handle Reply clicked");
	};

	return (
		<div className="grid gap-6 md:grid-cols-[1fr_300px]">
			<div className="space-y-6">
				<div className="flex flex-col md:flex-row justify-between items-start gap-4">
					<h2 className="text-xl font-semibold text-foreground">
						{selectedTicket?.subject}
					</h2>
					<div className="flex gap-2">
						<Badge>{selectedTicket?.status}</Badge>
						<Badge variant="outline">
							{selectedTicket?.priority}
						</Badge>
					</div>
				</div>
				<Card className="border-muted">
					<CardHeader>Conversation</CardHeader>
					<CardContent className="space-y-4">
						{conversation.map((msg, i) => (
							<div
								key={i}
								className={cn(
									"p-4 rounded-lg",
									msg.author === "Customer"
										? "bg-muted"
										: "bg-background"
								)}
							>
								<p className="font-medium">
									{msg.author} • {msg.time}
								</p>
								<p>{msg.message}</p>
							</div>
						))}
					</CardContent>
				</Card>
				<Textarea
					placeholder="Reply to customer..."
					className="min-h-[100px]"
				/>
				<Button onClick={handleReply}>Send Reply</Button>
			</div>
			<div className="space-y-6">
				<Card className="border-muted">
					<CardHeader>Customer Info</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>Name: {selectedTicket?.customerName}</p>
						<p>Email: {selectedTicket?.customerEmail}</p>
						{/* Add more */}
					</CardContent>
				</Card>
				<Card className="border-muted">
					<CardHeader>Related Items</CardHeader>
					<CardContent>{/* Links to Jira, etc. */}</CardContent>
				</Card>
			</div>
		</div>
	);
}
