/* eslint-disable @typescript-eslint/no-explicit-any */
// import { Commit, Contributor } from "@prisma/client";

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

// types/code.ts
export interface Repository {
	id: string;
	name: string;
	owner: string;
	fullName?: string;
	language?: string;
	isPrivate: boolean;
	defaultBranch?: string;
	description?: string;
}

export interface Commit {
	id: string;
	message: string;
	authorName: string;
	avatarUrl?: string;
	additions: number;
	deletions: number;
	committedAt: string;
}

export interface PullRequest {
	id: string;
	number: number;
	title: string;
	status: string;
	authorName: string;
	reviewerCount: number;
	avgReviewTime: number;
}

export interface Contributor {
	login: string;
	name?: string;
	avatarUrl?: string;
	contributions: number;
}

export interface Deployment {
	id: string;
	environment: string;
	status: string;
	timestamp: string;
}

export interface RepositoryHealth {
	// Overall score
	healthScore: number;
	grade: "A" | "B" | "C" | "D" | "F";

	// Core metrics
	issueHealth: {
		score: number;
		openCount: number;
		avgResolutionHours: number;
		staleCount: number; // >60 days
	};

	prHealth: {
		score: number;
		openCount: number;
		avgReviewHours: number;
		staleCount: number; // >30 days
		mergeRate: number; // %
	};

	deploymentHealth: {
		score: number;
		weeklyFrequency: number;
		failureRate: number; // %
		avgRestoreHours: number;
	};

	activityHealth: {
		score: number;
		weeklyCommits: number;
		activeContributors: number;
		staleBranches: number; // >90 days
	};
}

export interface CommitPR {
	name: string;
	commits: number;
	prs: number;
}

export interface BuildTrend {
	name: string; // Day-label, e.g., "Mon", "Tue"
	successRate: number;
}

export interface CodeCIMetrics {
	commits: number;
	prs: number;
	buildStatus: string;
	buildSuccessRate: number;
	repositoryHealth: RepositoryHealth;
	recentCommits: Commit[];
	recentPullRequests: PullRequest[];
	topContributors: Contributor[];
	recentDeploys: Deployment[];
	commitPRData: CommitPR[];
	buildTrendData: BuildTrend[];
	insight: string;
}
