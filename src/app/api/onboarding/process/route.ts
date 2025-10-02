import { NextResponse } from "next/server";

// Mock user ID - in production, get from auth session
const MOCK_USER_ID = "user-123";

// In-memory storage for demo - in production, use database
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const progressStore = new Map<string, any>();

export async function GET() {
	try {
		const progress = progressStore.get(MOCK_USER_ID);

		return NextResponse.json({
			progress: progress || null,
		});
	} catch (error) {
		console.error("[v0] Failed to get onboarding progress:", error);
		return NextResponse.json(
			{ error: "Failed to get progress" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { step, selectedIntegrations, connectedIntegrations, completed } =
			body;

		// Save progress to database
		// In production, this would be:
		// await db.userPreferences.upsert({
		//   where: { userId: MOCK_USER_ID },
		//   update: {
		//     onboardingProgress: {
		//       step,
		//       selectedIntegrations,
		//       connectedIntegrations,
		//       completed,
		//       updatedAt: new Date(),
		//     },
		//   },
		//   create: {
		//     userId: MOCK_USER_ID,
		//     onboardingProgress: {
		//       step,
		//       selectedIntegrations,
		//       connectedIntegrations,
		//       completed,
		//       updatedAt: new Date(),
		//     },
		//   },
		// })

		progressStore.set(MOCK_USER_ID, {
			step,
			selectedIntegrations,
			connectedIntegrations,
			completed,
			updatedAt: new Date().toISOString(),
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[v0] Failed to save onboarding progress:", error);
		return NextResponse.json(
			{ error: "Failed to save progress" },
			{ status: 500 }
		);
	}
}
