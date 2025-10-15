import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
	return withAuth(req, async (request, user) => {
		const organizationId = user.organizationId;
		try {
			// Fetch raw subscriptions
			const subscriptions = await prisma.financeSubscription.findMany({
				where: { organizationId },
				take: 100, // Limit to prevent large payloads
			});

			// Fetch raw invoices with customer names
			const invoices = await prisma.invoice.findMany({
				where: { organizationId },
				orderBy: { issuedDate: "desc" },
				take: 5,
			});

			// Fetch balance
			const balance = await prisma.balance.findFirst({
				where: { organizationId },
			});

			// Fetch events for customer activity
			const sixMonthsAgo = new Date();
			sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
			const events = await prisma.event.findMany({
				where: {
					organizationId,
					type: {
						in: [
							"customer.created",
							"customer.subscription.deleted",
						],
					},
					createdAt: { gte: sixMonthsAgo },
				},
				orderBy: { createdAt: "asc" },
				take: 50, // Limit for performance
			});

			const response = {
				subscriptions: subscriptions.map((sub) => ({
					...sub,
					startDate: sub.startDate.toISOString(),
					endDate: sub.endDate ? sub.endDate.toISOString() : null,
					nextBillingDate: sub.nextBillingDate
						? sub.nextBillingDate.toISOString()
						: null,
				})),
				invoices: invoices.map((inv) => ({
					...inv,
					issuedDate: inv.issuedDate.toISOString(),
				})),
				balance,
				events: events.map((ev) => ({
					...ev,
					createdAt: ev.createdAt.toISOString(),
				})),
				notConnected:
					subscriptions.length < 0 ||
					invoices.length < 0 ||
					!!balance ||
					events.length < 0,
			};
			return NextResponse.json(response);
		} catch (error) {
			console.log("Error getting finance data: ", error);
			return NextResponse.json(
				{ error: "Failed to fetch finance data" },
				{ status: 500 }
			);
		}
	});
}
