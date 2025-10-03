import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const session = await getSession();
		const user = session?.user;

		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const integrations = await prisma.integration.findMany({
			where: { userId: user.id },
		});
		return NextResponse.json({ integrations });
	} catch (error) {
		console.log("Error getting integrations: ", error);
		return NextResponse.json(
			{ error: "Failed to fetch integrations" },
			{ status: 500 }
		);
	}
}
