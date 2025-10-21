/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PaginationOptions {
	page?: number;
	limit?: number;
	search?: string;
}

export interface PaginatedResponse<T> {
	resources: T[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasMore: boolean;
}

export type Resources = {
	externalId: string;
	name: string;
	[key: string]: any;
};

export interface ProjectData {
	externalId: string;
	name: string;
	description?: string;
	attributes: Record<string, any>;
}
