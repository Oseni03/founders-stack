/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FeedbackItem {
	id: string;
	externalId: string;
	title: string;
	description: string;
	platform: string; // e.g., "zendesk", "usertesting", "intercom"
	status: string; // "NEW", "TRIAGED", "IN_PROGRESS", "RESOLVED"
	priority?: string; // "LOW", "MEDIUM", "HIGH"
	sentiment?: string; // "POSITIVE", "NEUTRAL", "NEGATIVE"
	sentimentScore?: number;
	category?: string;
	tags: string[];
	votes: number;
	userId?: string;
	userName?: string;
	userEmail?: string;
	userSegment?: string;
	assignedTo?: string;
	linkedFeature?: string;
	url?: string;
	createdAt: string;
	updatedAt: string;
	commentsCount: number;
}
