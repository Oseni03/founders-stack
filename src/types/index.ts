import { Subscription } from "@prisma/client";

export interface User {
	role?: string;
	id: string;
	createdAt: Date;
	updatedAt: Date;
	email: string;
	emailVerified: boolean;
	name: string;
	image?: string | null | undefined;
}

export interface MemberUser {
	email: string;
	name: string;
	image?: string;
}

export interface Member {
	id: string;
	organizationId: string;
	userId: string;
	role: string;
	createdAt: Date;
	user: MemberUser;
}
export interface Organization {
	id: string;
	name: string;
	slug: string;
	subscription?: Subscription;
	createdAt: Date;
	logo?: string | null;
	// metadata?: any;
}

export interface Note {
	id: string;
	title: string;
	content: string;
	authorId: string;
	tenantId: string;
	tags: string[];
	isPublic: boolean;
	createdAt: Date;
	updatedAt: Date;
	author: User;
}

export interface InvitationData {
	id: string;
	email: string;
	role: string;
	organizationId: string;
	teamId?: string;
	status: "pending" | "accepted" | "rejected" | "cancelled";
	createdAt: string;
	expiresAt: string;
}

// export interface Subscription {
// 	id: string;
// 	organizationId: string;
// 	status: string;
// 	amount: number;
// 	currency: string;
// 	recurringInterval: string;
// 	currentPeriodStart: string;
// 	currentPeriodEnd: string;
// 	cancelAtPeriodEnd: boolean;
// 	canceledAt?: string;
// 	startedAt: string;
// 	endsAt?: string;
// 	endedAt?: string;
// 	customerId: string;
// 	productId: string;
// 	discountId?: string;
// 	checkoutId: string;
// 	customerCancellationReason?: string;
// 	customerCancellationComment?: string;
// 	metadata?: string;
// 	customFieldData?: string;
// 	createdAt: string;
// 	modifiedAt?: string;
// }
