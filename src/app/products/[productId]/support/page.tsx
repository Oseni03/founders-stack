// app/support/page.tsx
import { Suspense } from "react";
import TicketList from "@/components/support/ticket-list";
import { getTickets } from "@/server/categories/support";

export default async function SupportPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;
	const initialTickets = await getTickets({ organizationId: productId }); // Assume orgId from auth

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-6 text-foreground">
				Support Tickets
			</h1>
			<Suspense
				fallback={
					<div className="text-muted-foreground">
						Loading tickets...
					</div>
				}
			>
				<TicketList initialTickets={initialTickets} />
			</Suspense>
		</div>
	);
}
