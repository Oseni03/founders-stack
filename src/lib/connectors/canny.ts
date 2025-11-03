/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	PaginatedResponse,
	PaginationOptions,
	ProjectData,
} from "@/types/connector";

interface FeedItem {
	externalId: string;
	title: string;
	description?: string;
	status: string;
	score: number;
	commentCount: number;
	author?: string;
	authorId?: string;
	owner?: string;
	ownerId?: string;
	createdAt: Date;
	url: string;
	tags: string[];
}

export class CannyConnector {
	private apiKey: string;
	private baseUrl: string = "https://canny.io/api/v1";

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	// ========================================================================
	// BOARD METHODS
	// ========================================================================

	/**
	 * Get all boards with pagination
	 * @param options - Pagination options
	 */
	async getBoards(
		options: PaginationOptions = {}
	): Promise<PaginatedResponse<ProjectData>> {
		try {
			const { page = 0, limit = 50 } = options;

			const response = await fetch(`${this.baseUrl}/boards/list`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					apiKey: this.apiKey,
				}),
			});

			await this.handleResponse(response);

			const data = await response.json();

			const boards: ProjectData[] = data.boards.map((board: any) => ({
				externalId: board.id,
				name: board.name,
				description: board.description || "",
				attributes: {
					postCount: board.postCount,
					url: board.url,
					created: new Date(board.created),
				},
			}));

			// Canny doesn't return total count, so we estimate based on returned data
			const hasMore = data.boards.length === limit;
			const total = hasMore
				? page + data.boards.length + 1
				: page + data.boards.length;

			return {
				resources: boards,
				total,
				totalPages: Math.ceil(total / limit),
				page,
				limit,
				hasMore,
			};
		} catch (error) {
			console.error("Canny boards fetching failed:", error);
			throw new Error("Failed to fetch Canny boards");
		}
	}

	// ========================================================================
	// POST METHODS (Projects/Issues)
	// ========================================================================

	/**
	 * Get posts for a board with pagination
	 * @param boardId - Board ID
	 * @param options - Pagination and filter options
	 */
	async getPosts(
		boardId: string,
		options: PaginationOptions & { status?: string } = {}
	): Promise<PaginatedResponse<FeedItem>> {
		try {
			const { page = 0, limit = 50, status } = options;

			const body: any = {
				apiKey: this.apiKey,
				boardID: boardId,
				limit,
				skip: page,
			};

			// Add status filter if provided
			if (status) {
				body.status = status;
			}

			const response = await fetch(`${this.baseUrl}/posts/list`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});

			await this.handleResponse(response);

			const data = await response.json();

			const posts: FeedItem[] = data.posts.map((post: any) => ({
				externalId: post.id,
				title: post.title,
				description: post?.details || undefined,
				category: post?.category?.name || "",
				status: post.status?.toLowerCase(),
				score: post.score,
				commentCount: post.commentCount,
				author: post.author?.name,
				authorId: post.author?.id,
				owner: post.owner?.name,
				ownerId: post.owner?.id,
				createdAt: new Date(post.created),
				url: post.url,
				tags: post.tags?.map((tag: any) => tag.name) || [],
			}));

			// Canny doesn't return total count, so we estimate
			const hasMore = data.posts.length === limit;
			const total = hasMore
				? page + data.posts.length + 1
				: page + data.posts.length;

			return {
				resources: posts,
				total,
				totalPages: Math.ceil(total / limit),
				page,
				limit,
				hasMore,
			};
		} catch (error) {
			console.error("Canny posts fetching failed:", error);
			throw new Error(
				`Failed to fetch Canny posts for board: ${boardId}`
			);
		}
	}

	// ========================================================================
	// UTILITY METHODS
	// ========================================================================

	/**
	 * Handle API response errors
	 */
	private async handleResponse(response: Response): Promise<void> {
		if (response.status === 401) {
			throw new Error("Canny authentication failed: Invalid API key");
		}

		if (response.status === 403) {
			throw new Error(
				"Canny authorization failed: Insufficient permissions"
			);
		}

		if (response.status === 404) {
			throw new Error("Canny resource not found");
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Canny API error: ${response.status} - ${
					errorData.error || response.statusText
				}`
			);
		}
	}

	/**
	 * Test the connection to Canny
	 */
	async testConnection(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/boards/list`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					apiKey: this.apiKey,
					limit: 1,
				}),
			});

			return response.ok;
		} catch (error) {
			console.error("Canny connection test failed:", error);
			return false;
		}
	}
}
