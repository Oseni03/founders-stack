export interface PaginationOptions {
	page?: number;
	limit?: number;
	search?: string;
}

export interface PaginatedResponse<T> {
	repositories: T[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasMore: boolean;
}

export type Resources = {
	externalId: string;
	name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};
