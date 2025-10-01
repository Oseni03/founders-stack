import { NextResponse } from "next/server";
import { CheckCircle2 } from "lucide-react";

export async function GET() {
	await new Promise((resolve) => setTimeout(resolve, 600));

	const data = {
		items: [
			{
				id: "1",
				title: "Implement user dashboard",
				description: "Create responsive layout with metrics",
				timestamp: "Completed 10 minutes ago",
				status: "success" as const,
				icon: CheckCircle2,
			},
			{
				id: "2",
				title: "Fix mobile navigation",
				description: "Resolve hamburger menu issues on iOS",
				timestamp: "Completed 1 hour ago",
				status: "success" as const,
				icon: CheckCircle2,
			},
			{
				id: "3",
				title: "Add payment integration",
				description: "Integrate Stripe checkout flow",
				timestamp: "In progress",
				status: "warning" as const,
				icon: CheckCircle2,
			},
			{
				id: "4",
				title: "Database migration",
				description: "Update schema for new features",
				timestamp: "Blocked",
				status: "error" as const,
				icon: CheckCircle2,
			},
		],
	};

	return NextResponse.json(data);
}
