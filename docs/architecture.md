# Founder's Stack - System Architecture

## Overview

Founder's Stack is a centralized dashboard that aggregates data from multiple SaaS tools used by indie founders. The architecture prioritizes scalability, rapid integration expansion, and real-time data synchronization.

## Tech Stack

### Frontend

- **Framework**: Next.js 14+ (App Router)
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: SWR for data fetching/caching
- **Charts**: Recharts for metrics visualization
- **Real-time**: Server-Sent Events (SSE) or WebSockets for live updates

### Backend

- **Runtime**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL (via Neon or Supabase)
- **Caching**: Redis (via Upstash) for rate limiting and session management
- **Queue**: Vercel Queues or Upstash QStash for background jobs
- **Authentication**: NextAuth.js or Supabase Auth

### Infrastructure

- **Hosting**: Vercel (serverless functions, edge runtime)
- **Database**: Neon (serverless Postgres) or Supabase
- **Storage**: Vercel Blob for file uploads
- **Monitoring**: Vercel Analytics + Sentry for error tracking

## System Components

### 1. Integration Layer

**Purpose**: Normalize data from disparate SaaS APIs into a unified format

**Components**:

- **Integration Adapters**: One adapter per tool (GitHub, Stripe, Jira, etc.)
- **OAuth Manager**: Handle OAuth flows for user authorization
- **Sync Engine**: Background jobs to fetch and update data
- **Webhook Receiver**: Real-time updates from tools that support webhooks

**Pattern**:
\`\`\`typescript
interface IntegrationAdapter {
name: string;
authenticate(userId: string): Promise<AuthToken>;
fetchData(userId: string, dataType: string): Promise<NormalizedData>;
sync(userId: string): Promise<void>;
handleWebhook(payload: unknown): Promise<void>;
}
\`\`\`

### 2. Data Normalization Layer

**Purpose**: Transform tool-specific data into common schemas

**Categories**:

- **Tasks**: Jira, Linear, Asana, GitHub Issues → Unified Task schema
- **Revenue**: Stripe, Paddle, Gumroad → Unified Transaction schema
- **Code**: GitHub, GitLab, Bitbucket → Unified Commit/PR schema
- **Communication**: Slack, Discord → Unified Message schema
- **Analytics**: Google Analytics, Plausible → Unified Event schema
- **Support**: Zendesk, Intercom → Unified Ticket schema

### 3. Computed Metrics Engine

**Purpose**: Calculate cross-tool insights

**Examples**:

- MRR trend correlated with deployment frequency
- Churn rate vs. support ticket volume
- Task velocity vs. revenue growth
- Error rate impact on user satisfaction

**Implementation**:

- Scheduled jobs (cron) to compute metrics
- Store results in `computed_metrics` table
- Cache frequently accessed metrics in Redis

### 4. Dashboard UI

**Purpose**: Present unified view with drill-down capabilities

**Views**:

- **Overview**: High-level KPIs across all categories
- **Category Views**: Deep dive into Tasks, Revenue, Code, etc.
- **Tool Views**: Individual tool data with native context
- **Insights**: Computed metrics and correlations
- **Alerts**: Configurable notifications for thresholds

### 5. Action Layer (Premium)

**Purpose**: Enable CRUD operations across tools

**Phase 2 Feature**:

- Create tasks in Jira/Linear from dashboard
- Respond to support tickets
- Trigger deployments
- Update project status

## Data Flow

### Initial Sync

1. User connects a tool via OAuth
2. Integration adapter fetches historical data (last 90 days)
3. Data normalized and stored in database
4. Computed metrics calculated
5. Dashboard updated

### Ongoing Sync

1. **Polling**: Scheduled jobs fetch updates every 5-15 minutes
2. **Webhooks**: Real-time updates for supported tools
3. **On-Demand**: User-triggered refresh for specific data

### Real-time Updates

1. Background job updates database
2. Server-Sent Events push updates to connected clients
3. SWR revalidates cached data
4. UI updates without full page reload

## Security Considerations

### Authentication

- User accounts with email/password or OAuth (Google, GitHub)
- Session management with secure HTTP-only cookies
- Multi-factor authentication (optional)

### Authorization

- OAuth tokens encrypted at rest
- Scoped permissions per integration
- User can revoke access per tool

### Data Privacy

- User data isolated by `user_id`
- No cross-user data access
- GDPR-compliant data deletion

### Rate Limiting

- Per-user API rate limits (Redis-based)
- Per-integration rate limits to respect SaaS API quotas
- Exponential backoff for failed requests

## Scalability Strategy

### Database

- Partition tables by `user_id` for horizontal scaling
- Index on frequently queried fields (user_id, created_at, tool_name)
- Archive old data (>1 year) to cold storage

### Caching

- Redis for session data, rate limits, and hot metrics
- SWR for client-side caching with stale-while-revalidate
- CDN caching for static assets

### Background Jobs

- Queue system for async tasks (sync, metrics computation)
- Retry logic with exponential backoff
- Dead letter queue for failed jobs

### API Design

- RESTful endpoints for CRUD operations
- GraphQL (optional) for flexible querying
- Pagination for large datasets
- Compression (gzip) for responses

## Deployment Architecture

### Vercel Deployment

- **Edge Functions**: Authentication, rate limiting
- **Serverless Functions**: API routes, integration adapters
- **Cron Jobs**: Scheduled syncs (Vercel Cron)
- **Environment Variables**: Secrets management

### Database

- **Primary**: Neon Postgres (serverless, auto-scaling)
- **Replica**: Read replicas for analytics queries
- **Backup**: Automated daily backups

### Monitoring

- **Logs**: Vercel logs + structured logging
- **Errors**: Sentry for error tracking
- **Metrics**: Custom metrics for sync success rate, API latency
- **Alerts**: PagerDuty or email for critical failures

## MVP Simplifications

### Phase 1 (Read-Only)

- 3-5 core integrations (GitHub, Stripe, Linear, Slack, Analytics)
- Polling-based sync (no webhooks)
- Basic computed metrics (MRR, task count, commit frequency)
- Single dashboard view (no drill-downs)
- No action layer (read-only)

### Phase 2 (Premium Features)

- 10+ integrations
- Webhook support for real-time updates
- Advanced computed metrics with correlations
- CRUD operations across tools
- Custom alerts and notifications
- Team collaboration features

## Technology Decisions Rationale

### Why Next.js?

- Full-stack framework (frontend + API routes)
- Excellent Vercel integration
- Server components for performance
- Built-in API routes for backend logic

### Why PostgreSQL?

- Relational data model fits normalized schemas
- JSONB for flexible tool-specific metadata
- Strong consistency for financial data (Stripe)
- Mature ecosystem and tooling

### Why Redis?

- Fast caching for frequently accessed data
- Rate limiting with atomic operations
- Session management
- Pub/sub for real-time features

### Why Vercel?

- Zero-config deployment
- Serverless scaling
- Edge network for global performance
- Integrated monitoring and analytics
