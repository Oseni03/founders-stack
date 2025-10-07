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
