import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";
import { getEvents } from "@/server/analytics";

// Define query parameter schema for validation
const QuerySchema = z.object({
	range: z.enum(["24h", "7d", "30d", "90d"]).default("7d"),
});

// Define the time range to date range mapping
const getDateRange = (range: string): Date => {
	const now = new Date();
	switch (range) {
		case "24h":
			return new Date(now.getTime() - 24 * 60 * 60 * 1000);
		case "7d":
			return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		case "30d":
			return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		case "90d":
			return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
		default:
			return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	}
};

export async function GET(request: NextRequest) {
	return withAuth(request, async (request, user) => {
		try {
			// Parse and validate query parameters
			const { searchParams } = new URL(request.url);
			const parsedParams = QuerySchema.safeParse({
				range: searchParams.get("range"),
			});

			if (!parsedParams.success) {
				return NextResponse.json(
					{
						error: "Invalid query parameters",
						details: parsedParams.error,
					},
					{ status: 400 }
				);
			}

			const { range } = parsedParams.data;
			const startDate = getDateRange(range);

			// Fetch analytics events from Prisma
			const events = await getEvents(user.organizationId, startDate);

			// Transform events to match frontend expectations
			const transformedEvents = events.map((event) => ({
				...event,
				timestamp: event.timestamp.toISOString(),
				createdAt: event.createdAt.toISOString(),
				updatedAt: event.updatedAt.toISOString(),
			}));

			return NextResponse.json(transformedEvents, { status: 200 });
		} catch (error) {
			console.error(
				"[API_ANALYTICS] Error fetching analytics events:",
				error
			);
			return NextResponse.json(
				{ error: "Internal server error" },
				{ status: 500 }
			);
		}
	});
}
