import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	// Mock sync history data
	const data = {
		history: [
			{
				id: "1",
				timestamp: "2 hours ago",
				status: "success",
				itemsSynced: 234,
				duration: "12s",
			},
			{
				id: "2",
				timestamp: "4 hours ago",
				status: "success",
				itemsSynced: 187,
				duration: "9s",
			},
			{
				id: "3",
				timestamp: "6 hours ago",
				status: "failed",
				itemsSynced: 0,
				duration: "3s",
			},
			{
				id: "4",
				timestamp: "8 hours ago",
				status: "success",
				itemsSynced: 312,
				duration: "15s",
			},
			{
				id: "5",
				timestamp: "10 hours ago",
				status: "success",
				itemsSynced: 198,
				duration: "11s",
			},
		],
	};

	return NextResponse.json(data);
}
