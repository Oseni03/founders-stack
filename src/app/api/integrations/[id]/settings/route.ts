import { NextResponse } from "next/server";

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } }
) {
	const { syncFrequency } = await request.json();

	// Mock - update integration settings
	console.log(
		`[v0] Updating ${params.id} settings: syncFrequency=${syncFrequency}`
	);

	return NextResponse.json({ success: true });
}
