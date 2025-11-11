import { auth } from "@/lib/auth";
import logger from "@/lib/logger";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ invitationId: string }> }
) {
	const { invitationId } = await params;

	try {
		const data = await auth.api.acceptInvitation({
			body: {
				invitationId,
			},
			headers: await headers(),
		});

		logger.debug("Invitation acceptance data: ", { data });
		return NextResponse.redirect(new URL("/products", request.url));
	} catch (error) {
		logger.error("Invitation acceptance error: ", { error });
		return NextResponse.redirect(new URL("/products", request.url));
	}
}
