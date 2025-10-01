import { NextResponse } from "next/server";

export async function GET() {
	// Mock data - replace with actual GitHub/GitLab API integration
	const data = {
		open: 12,
		merged: 34,
		draft: 5,
	};

	return NextResponse.json(data);
}
