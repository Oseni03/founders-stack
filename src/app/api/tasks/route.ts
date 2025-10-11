import { withAuth } from "@/lib/middleware";
import { getTasks } from "@/server/tasks";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	return withAuth(req, async (request, user) => {
		try {
			const tasks = await getTasks(user.organizationId);

			// Calculate task counts by source
			const counts = {
				github: tasks.filter((t) => t.sourceTool === "github").length,
				jira: tasks.filter((t) => t.sourceTool === "jira").length,
				linear: tasks.filter((t) => t.sourceTool === "linear").length,
				asana: tasks.filter((t) => t.sourceTool === "asana").length,
				total: tasks.length,
			};
			return NextResponse.json({
				tasks,
				counts,
			});
		} catch (error) {
			console.log("Error getting tasks: ", error);
			return NextResponse.json(
				{ error: "Failed to fetch tasks" },
				{ status: 500 }
			);
		}
	});
}
