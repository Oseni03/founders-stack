// components/support/TicketList.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupportStore } from "@/zustand/providers/support-store-provider";
import type { SupportTicket } from "@prisma/client"; // Assume type from Prisma
import { getTickets } from "@/server/categories/support";
import { useParams } from "next/navigation";

interface TicketListProps {
	initialTickets: SupportTicket[];
}

export default function TicketList({ initialTickets }: TicketListProps) {
	const { providerId } = useParams<{ providerId: string }>();
	const { tickets, setTickets, filters, setFilters } = useSupportStore(
		(state) => state
	);
	const [loading, setLoading] = useState(false);

	// Initialize store with initial data
	if (tickets.length === 0) setTickets(initialTickets);

	const filteredTickets = tickets.filter((t) => {
		// Simple filtering logic; expand as needed
		if (filters.status && t.status !== filters.status) return false;
		if (filters.priority && t.priority !== filters.priority) return false;
		// Add more filters...
		return true;
	});

	const handleFilterChange = (key: keyof typeof filters, value: string) => {
		setFilters({ ...filters, [key]: value });
	};

	const refreshTickets = async () => {
		setLoading(true);
		// Simulate fetch; in real, call server action
		const newTickets = await getTickets({ organizationId: providerId });
		setTickets(newTickets);
		setLoading(false);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row gap-4">
				<Select onValueChange={(v) => handleFilterChange("status", v)}>
					<SelectTrigger className="w-full md:w-[180px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Open">Open</SelectItem>
						<SelectItem value="Pending">Pending</SelectItem>
						{/* Add more */}
					</SelectContent>
				</Select>
				{/* Add other filters similarly */}
				<Button
					onClick={refreshTickets}
					disabled={loading}
					className="w-full md:w-auto"
				>
					{loading ? "Refreshing..." : "Refresh"}
				</Button>
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{filteredTickets.map((ticket) => (
					<Card key={ticket.id} className="border-muted">
						<CardHeader className="pb-2">
							<div className="flex justify-between items-start">
								<CardTitle className="text-lg font-medium text-foreground">
									{ticket.subject}
								</CardTitle>
								<Badge
									variant={
										ticket.priority === "URGENT"
											? "destructive"
											: "secondary"
									}
								>
									{ticket.priority}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-2 text-sm text-muted-foreground">
							<p>Customer: {ticket.customerName}</p>
							<p>
								Opened:{" "}
								{new Date(ticket.createdAt).toLocaleString()}
							</p>
							<p>Assigned: {ticket.assignedToName}</p>
							<Button
								variant="outline"
								asChild
								className="w-full"
							>
								<a href={`/support/${ticket.id}`}>
									View Ticket
								</a>
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
