// import { type NextRequest, NextResponse } from "next/server";
// import { createServerClient } from "@/lib/supabase/server";

// export async function GET() {
// 	try {
// 		const supabase = await createServerClient();

// 		const {
// 			data: { user },
// 		} = await supabase.auth.getUser();

// 		if (!user) {
// 			return NextResponse.json(
// 				{ error: "Unauthorized" },
// 				{ status: 401 }
// 			);
// 		}

// 		// Get recent searches for the user
// 		const { data: searches } = await supabase
// 			.from("cdm_recent_searches")
// 			.select("query")
// 			.eq("user_id", user.id)
// 			.order("created_at", { ascending: false })
// 			.limit(5);

// 		return NextResponse.json({
// 			searches: searches?.map((s) => s.query) || [],
// 		});
// 	} catch (error) {
// 		console.error("[v0] Failed to fetch recent searches:", error);
// 		return NextResponse.json(
// 			{ error: "Failed to fetch recent searches" },
// 			{ status: 500 }
// 		);
// 	}
// }

// export async function POST(request: NextRequest) {
// 	try {
// 		const supabase = await createServerClient();

// 		const {
// 			data: { user },
// 		} = await supabase.auth.getUser();

// 		if (!user) {
// 			return NextResponse.json(
// 				{ error: "Unauthorized" },
// 				{ status: 401 }
// 			);
// 		}

// 		const { query } = await request.json();

// 		if (!query || query.length < 2) {
// 			return NextResponse.json(
// 				{ error: "Invalid query" },
// 				{ status: 400 }
// 			);
// 		}

// 		// Check if search already exists
// 		const { data: existing } = await supabase
// 			.from("cdm_recent_searches")
// 			.select("id")
// 			.eq("user_id", user.id)
// 			.eq("query", query)
// 			.single();

// 		if (existing) {
// 			// Update timestamp
// 			await supabase
// 				.from("cdm_recent_searches")
// 				.update({ created_at: new Date().toISOString() })
// 				.eq("id", existing.id);
// 		} else {
// 			// Insert new search
// 			await supabase.from("cdm_recent_searches").insert({
// 				user_id: user.id,
// 				query,
// 			});

// 			// Keep only last 10 searches
// 			const { data: allSearches } = await supabase
// 				.from("cdm_recent_searches")
// 				.select("id")
// 				.eq("user_id", user.id)
// 				.order("created_at", { ascending: false });

// 			if (allSearches && allSearches.length > 10) {
// 				const idsToDelete = allSearches.slice(10).map((s) => s.id);
// 				await supabase
// 					.from("cdm_recent_searches")
// 					.delete()
// 					.in("id", idsToDelete);
// 			}
// 		}

// 		return NextResponse.json({ success: true });
// 	} catch (error) {
// 		console.error("[v0] Failed to save recent search:", error);
// 		return NextResponse.json(
// 			{ error: "Failed to save search" },
// 			{ status: 500 }
// 		);
// 	}
// }

import { type NextRequest, NextResponse } from "next/server";

// In-memory storage for dummy data (in production, this would be a database)
const recentSearches: Record<string, string[]> = {
	"dummy-user": [
		"project analytics",
		"team meeting notes",
		"budget report",
		"code review",
		"customer feedback",
	],
};

export async function GET() {
	try {
		// Simulate authentication - in production, check real user session
		const userId = "dummy-user";

		// Return dummy recent searches
		return NextResponse.json({
			searches: recentSearches[userId] || [],
		});
	} catch (error) {
		console.error("[v0] Failed to fetch recent searches:", error);
		return NextResponse.json(
			{ error: "Failed to fetch recent searches" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		// Simulate authentication - in production, check real user session
		const userId = "dummy-user";

		const { query } = await request.json();

		if (!query || query.length < 2) {
			return NextResponse.json(
				{ error: "Invalid query" },
				{ status: 400 }
			);
		}

		// Initialize user's searches if not exists
		if (!recentSearches[userId]) {
			recentSearches[userId] = [];
		}

		// Remove query if it already exists
		const existingIndex = recentSearches[userId].indexOf(query);
		if (existingIndex > -1) {
			recentSearches[userId].splice(existingIndex, 1);
		}

		// Add query to the beginning of the array
		recentSearches[userId].unshift(query);

		// Keep only last 10 searches
		if (recentSearches[userId].length > 10) {
			recentSearches[userId] = recentSearches[userId].slice(0, 10);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[v0] Failed to save recent search:", error);
		return NextResponse.json(
			{ error: "Failed to save search" },
			{ status: 500 }
		);
	}
}
