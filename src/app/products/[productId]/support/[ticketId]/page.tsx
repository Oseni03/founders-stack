// app/support/[ticketId]/page.tsx
import { Suspense } from "react";
import TicketDetail from "@/components/support/ticket-detail";
import { getTicket } from "@/server/categories/support";

export default async function TicketDetailPage({
	params,
}: {
	params: Promise<{ productId: string; ticketId: string }>;
}) {
	const { productId, ticketId } = await params;
	const ticket = await getTicket(ticketId, productId); // Assume orgId

	if (!ticket) {
		return (
			<div className="container mx-auto px-4 py-8 text-destructive">
				Ticket not found
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-6 text-foreground">
				Ticket Details
			</h1>
			<Suspense
				fallback={
					<div className="text-muted-foreground">
						Loading ticket details...
					</div>
				}
			>
				<TicketDetail ticket={ticket} />
			</Suspense>
		</div>
	);
}
