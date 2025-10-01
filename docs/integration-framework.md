# Founder's Stack - Integration Framework

## Overview
The integration framework provides a standardized way to connect, authenticate, sync, and normalize data from third-party SaaS tools. It's designed for rapid expansion—adding a new integration should take 1-2 days.

## Integration Adapter Pattern

### Base Interface
All integrations implement a common interface:

\`\`\`typescript
// lib/integrations/base-adapter.ts

export interface IntegrationConfig {
  name: string;
  displayName: string;
  category: 'tasks' | 'revenue' | 'code' | 'communication' | 'analytics' | 'support';
  icon: string;
  authType: 'oauth2' | 'api_key' | 'basic';
  scopes?: string[];
  webhookSupport: boolean;
}

export interface NormalizedData {
  id: string;
  externalId: string;
  externalUrl?: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  errors?: string[];
  nextSyncToken?: string; // For incremental syncs
}

export abstract class BaseIntegrationAdapter {
  abstract config: IntegrationConfig;
  
  // Authentication
  abstract getAuthUrl(userId: string, redirectUri: string): Promise<string>;
  abstract handleCallback(code: string, userId: string): Promise<AuthTokens>;
  abstract refreshToken(userId: string): Promise<AuthTokens>;
  
  // Data fetching
  abstract fetchData(
    userId: string, 
    dataType: string, 
    options?: SyncOptions
  ): Promise<NormalizedData[]>;
  
  // Sync operations
  abstract sync(userId: string, options?: SyncOptions): Promise<SyncResult>;
  
  // Webhooks (optional)
  handleWebhook?(payload: unknown): Promise<void>;
  
  // Validation
  abstract validateConnection(userId: string): Promise<boolean>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
}

export interface SyncOptions {
  fullSync?: boolean; // Full sync vs incremental
  since?: Date; // Fetch data since this date
  dataTypes?: string[]; // Specific data types to sync
  limit?: number; // Max records per request
}
\`\`\`

## Example Integration: GitHub

\`\`\`typescript
// lib/integrations/github-adapter.ts

import { Octokit } from '@octokit/rest';
import { BaseIntegrationAdapter, IntegrationConfig, NormalizedData, SyncResult } from './base-adapter';
import { getIntegrationTokens, saveIntegrationTokens } from '@/lib/db/integrations';
import { saveCommits } from '@/lib/db/commits';

export class GitHubAdapter extends BaseIntegrationAdapter {
  config: IntegrationConfig = {
    name: 'github',
    displayName: 'GitHub',
    category: 'code',
    icon: '/icons/github.svg',
    authType: 'oauth2',
    scopes: ['repo', 'read:user'],
    webhookSupport: true,
  };

  async getAuthUrl(userId: string, redirectUri: string): Promise<string> {
    const clientId = process.env.GITHUB_CLIENT_ID!;
    const state = await this.generateState(userId); // CSRF protection
    
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${this.config.scopes?.join(',')}&state=${state}`;
  }

  async handleCallback(code: string, userId: string): Promise<AuthTokens> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    
    const tokens: AuthTokens = {
      accessToken: data.access_token,
      scopes: data.scope?.split(','),
    };

    await saveIntegrationTokens(userId, 'github', tokens);
    return tokens;
  }

  async refreshToken(userId: string): Promise<AuthTokens> {
    // GitHub tokens don't expire, so just return existing
    return await getIntegrationTokens(userId, 'github');
  }

  async fetchData(
    userId: string, 
    dataType: string, 
    options?: SyncOptions
  ): Promise<NormalizedData[]> {
    const tokens = await getIntegrationTokens(userId, 'github');
    const octokit = new Octokit({ auth: tokens.accessToken });

    if (dataType === 'commits') {
      return await this.fetchCommits(octokit, options);
    } else if (dataType === 'pull_requests') {
      return await this.fetchPullRequests(octokit, options);
    } else if (dataType === 'issues') {
      return await this.fetchIssues(octokit, options);
    }

    throw new Error(`Unsupported data type: ${dataType}`);
  }

  private async fetchCommits(octokit: Octokit, options?: SyncOptions): Promise<NormalizedData[]> {
    const repos = await this.getUserRepos(octokit);
    const commits: NormalizedData[] = [];

    for (const repo of repos) {
      const { data } = await octokit.repos.listCommits({
        owner: repo.owner.login,
        repo: repo.name,
        since: options?.since?.toISOString(),
        per_page: options?.limit || 100,
      });

      for (const commit of data) {
        commits.push({
          id: commit.sha,
          externalId: commit.sha,
          externalUrl: commit.html_url,
          data: {
            repositoryName: repo.full_name,
            branch: 'main', // Simplified
            message: commit.commit.message,
            authorName: commit.commit.author?.name,
            authorEmail: commit.commit.author?.email,
            commitDate: new Date(commit.commit.author?.date || Date.now()),
            additions: commit.stats?.additions || 0,
            deletions: commit.stats?.deletions || 0,
            filesChanged: commit.files?.length || 0,
          },
          metadata: {
            sha: commit.sha,
            parents: commit.parents.map(p => p.sha),
          },
        });
      }
    }

    return commits;
  }

  private async getUserRepos(octokit: Octokit) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });
    return data;
  }

  async sync(userId: string, options?: SyncOptions): Promise<SyncResult> {
    try {
      const dataTypes = options?.dataTypes || ['commits', 'pull_requests', 'issues'];
      let totalProcessed = 0;
      let totalFailed = 0;

      for (const dataType of dataTypes) {
        const data = await this.fetchData(userId, dataType, options);
        
        if (dataType === 'commits') {
          await saveCommits(userId, 'github', data);
        }
        // Handle other data types...

        totalProcessed += data.length;
      }

      return {
        success: true,
        recordsProcessed: totalProcessed,
        recordsFailed: totalFailed,
      };
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    // Handle GitHub webhook events (push, pull_request, issues, etc.)
    if (payload.commits) {
      // Process new commits
      const userId = await this.getUserIdFromRepo(payload.repository.full_name);
      const commits = payload.commits.map((c: any) => ({
        id: c.id,
        externalId: c.id,
        externalUrl: c.url,
        data: {
          repositoryName: payload.repository.full_name,
          message: c.message,
          authorName: c.author.name,
          authorEmail: c.author.email,
          commitDate: new Date(c.timestamp),
        },
        metadata: {},
      }));
      
      await saveCommits(userId, 'github', commits);
    }
  }

  async validateConnection(userId: string): Promise<boolean> {
    try {
      const tokens = await getIntegrationTokens(userId, 'github');
      const octokit = new Octokit({ auth: tokens.accessToken });
      await octokit.users.getAuthenticated();
      return true;
    } catch {
      return false;
    }
  }

  private async generateState(userId: string): Promise<string> {
    // Generate and store CSRF token
    return Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
  }

  private async getUserIdFromRepo(repoFullName: string): Promise<string> {
    // Look up user_id from integration metadata
    // This would query the integrations table
    throw new Error('Not implemented');
  }
}
\`\`\`

## Integration Registry

\`\`\`typescript
// lib/integrations/registry.ts

import { BaseIntegrationAdapter } from './base-adapter';
import { GitHubAdapter } from './github-adapter';
import { StripeAdapter } from './stripe-adapter';
import { LinearAdapter } from './linear-adapter';
// Import other adapters...

export class IntegrationRegistry {
  private static adapters = new Map<string, BaseIntegrationAdapter>();

  static register(adapter: BaseIntegrationAdapter) {
    this.adapters.set(adapter.config.name, adapter);
  }

  static get(name: string): BaseIntegrationAdapter | undefined {
    return this.adapters.get(name);
  }

  static getAll(): BaseIntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }

  static getByCategory(category: string): BaseIntegrationAdapter[] {
    return Array.from(this.adapters.values()).filter(
      a => a.config.category === category
    );
  }
}

// Register all adapters
IntegrationRegistry.register(new GitHubAdapter());
IntegrationRegistry.register(new StripeAdapter());
IntegrationRegistry.register(new LinearAdapter());
// Register others...
\`\`\`

## OAuth Flow

### 1. Initiate OAuth
\`\`\`typescript
// app/api/integrations/[tool]/connect/route.ts

import { IntegrationRegistry } from '@/lib/integrations/registry';
import { getServerSession } from 'next-auth';

export async function GET(
  request: Request,
  { params }: { params: { tool: string } }
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adapter = IntegrationRegistry.get(params.tool);
  if (!adapter) {
    return Response.json({ error: 'Integration not found' }, { status: 404 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/${params.tool}/callback`;
  const authUrl = await adapter.getAuthUrl(session.user.id, redirectUri);

  return Response.redirect(authUrl);
}
\`\`\`

### 2. Handle Callback
\`\`\`typescript
// app/api/integrations/[tool]/callback/route.ts

export async function GET(
  request: Request,
  { params }: { params: { tool: string } }
) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return Response.json({ error: 'Missing code' }, { status: 400 });
  }

  // Verify state (CSRF protection)
  const session = await getServerSession();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adapter = IntegrationRegistry.get(params.tool);
  if (!adapter) {
    return Response.json({ error: 'Integration not found' }, { status: 404 });
  }

  // Exchange code for tokens
  await adapter.handleCallback(code, session.user.id);

  // Trigger initial sync
  await triggerSync(session.user.id, params.tool);

  // Redirect to dashboard
  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration=${params.tool}&status=connected`);
}
\`\`\`

## Sync Engine

### Background Sync Job
\`\`\`typescript
// lib/sync/sync-engine.ts

import { IntegrationRegistry } from '@/lib/integrations/registry';
import { getActiveIntegrations, updateIntegrationSyncStatus } from '@/lib/db/integrations';
import { createSyncJob, updateSyncJob } from '@/lib/db/sync-jobs';

export async function syncAllUsers() {
  const integrations = await getActiveIntegrations();

  for (const integration of integrations) {
    await syncIntegration(integration.userId, integration.toolName);
  }
}

export async function syncIntegration(userId: string, toolName: string) {
  const adapter = IntegrationRegistry.get(toolName);
  if (!adapter) {
    console.error(`Adapter not found: ${toolName}`);
    return;
  }

  const jobId = await createSyncJob(userId, toolName, 'incremental_sync');

  try {
    // Determine sync options (incremental vs full)
    const lastSyncAt = await getLastSyncTime(userId, toolName);
    const options = {
      fullSync: !lastSyncAt,
      since: lastSyncAt || undefined,
    };

    const result = await adapter.sync(userId, options);

    await updateSyncJob(jobId, {
      status: 'completed',
      recordsProcessed: result.recordsProcessed,
      recordsFailed: result.recordsFailed,
    });

    await updateIntegrationSyncStatus(userId, toolName, {
      lastSyncAt: new Date(),
      lastSyncStatus: 'success',
    });
  } catch (error) {
    await updateSyncJob(jobId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    await updateIntegrationSyncStatus(userId, toolName, {
      lastSyncStatus: 'error',
      lastSyncError: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
\`\`\`

### Cron Job (Vercel Cron)
\`\`\`typescript
// app/api/cron/sync/route.ts

import { syncAllUsers } from '@/lib/sync/sync-engine';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await syncAllUsers();

  return Response.json({ success: true });
}
