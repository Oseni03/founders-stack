/* eslint-disable @typescript-eslint/no-explicit-any */
import { Commit, Contributor } from "@prisma/client";

export interface PRStatus {
	open: number;
	merged: number;
	draft: number;
}

export interface RepoHealth {
	score: number;
	openIssues: number;
	stalePRs: number;
	codeReviewTime: string;
	testCoverage: number;
}

export interface ContributorType extends Contributor {
	attributes: {
		avatarUrl?: string;
		additions?: number;
		deletions?: number;
	};
}

export interface CommitType extends Commit {
	attributes: {
		avatarUrl?: string;
		branch?: string;
		url?: string;
	};
}

export interface CommitData {
	externalId: string; // SHA
	sha: string; // Same as externalId, but explicit
	branch?: string;
	authorName?: string;
	authorEmail?: string;
	committerName?: string;
	avatarUrl?: string;
	committerEmail?: string;
	committedAt: Date;
	message: string;
	additions?: number;
	deletions?: number;
	total?: number;
	url: string;
	attributes?: Record<string, any>;
}

export interface RepoData {
	externalId: string;
	name: string;
	fullName: string;
	owner: string;
	url: string;
	description: string | null;
	defaultBranch: string;
	language: string | null;
	isPrivate: boolean;
	isArchived: boolean;
	openIssuesCount: number;
	forksCount: number;
	stargazersCount: number;
	attributes?: Record<string, any>;
}

export interface PullRequestData {
	externalId: string;
	number: number;
	title: string;
	body: string | null;
	url: string;
	status: string; // "open", "closed", "merged", "draft"
	reviewStatus?: string;
	isDraft: boolean;
	baseBranch: string;
	headBranch: string;
	authorId?: string;
	authorLogin?: string;
	reviewerIds: string[];
	createdAt: Date;
	mergedAt?: Date;
	closedAt?: Date;
	avgReviewTime?: number;
	attributes?: Record<string, any>;
}

export interface IssueData {
	externalId: string;
	number: number;
	title: string;
	body: string | null;
	url: string;
	status: string; // "open", "closed"
	authorId?: string;
	authorLogin?: string;
	assigneeIds: string[];
	labels: string[];
	commentsCount: number;
	createdAt: Date;
	closedAt?: Date;
	attributes?: Record<string, any>;
}

export interface BranchData {
	externalId: string;
	name: string;
	sha: string;
	isProtected: boolean;
	createdBy?: string;
	status: string; // "active", "stale"
	lastCommitAt?: Date;
	commitsAhead: number;
	commitsBehind: number;
	attributes?: Record<string, any>;
}

export interface ContributorData {
	externalId: string;
	login: string;
	name?: string;
	email?: string;
	avatarUrl?: string;
	contributions: number;
	lastContributedAt?: Date;
	attributes?: Record<string, any>;
}

export interface RepositoryHealthData {
	healthScore: number; // 0-100 computed score
	openIssues: number;
	stalePrs: number; // PRs open >30 days
	avgReviewTime: number; // Average in hours
	testCoverage?: number; // Optional, if available from external tools
}
