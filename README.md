# ProductStack

A unified dashboard for product managers to monitor and manage their entire product workflow in one place. Built with Next.js, ProductStack aggregates data from tools like Jira, Slack, Notion, Mixpanel, Intercom, Figma, GitHub, and Zendesk, providing real-time insights, cross-tool analytics, and quick actions to streamline PM workflows.

## Overview

ProductStack tackles the fragmentation product managers face when switching between 8-12 tools daily. It offers a centralized, customizable dashboard that integrates data from essential PM tools, enabling real-time monitoring, actionable insights, and reduced context-switching. Designed for PMs in tech companies of all sizes.

---

## 🚀 Features

### Core Functionality

- **Unified Dashboard**: Single view of tasks, messages, metrics, feedback, designs, code, support tickets, and documents.
- **Deep Integrations**: Connects with Jira, Slack, Notion, Mixpanel, Intercom, Figma, GitHub, and Zendesk via robust APIs.
- **Real-Time Monitoring**: Live updates using webhooks (where supported) and polling for critical metrics and notifications.
- **Cross-Tool Insights**: Correlate data, e.g., link Zendesk ticket spikes to Mixpanel usage drops or Jira tasks to Figma designs.
- **Customizable Views**: Create tailored views like "Daily Standup" (Jira + Slack) or "Product Health" (Mixpanel + Intercom).
- **Quick Actions**: Perform tasks like commenting on Jira tickets or replying to Slack messages without leaving the app.
- **Universal Search**: Search across all tools for tasks, messages, docs, and more.

### MVP Scope

- **Product Roadmapping (Jira)**: Task lists, sprint burndowns, roadmap timelines.
- **Communication (Slack)**: Unified inbox, mentions feed, quick replies.
- **Documentation (Notion)**: Recent docs, comment tracking, template creation.
- **Analytics (Mixpanel)**: Key metrics, anomaly alerts, trend charts.
- **User Research (Intercom)**: Feedback inbox, sentiment trends, feature request prioritization.
- **Design (Figma)**: Design previews, review queues, handoff specs.
- **Development (GitHub)**: PR reviews, build status, issue tracking.
- **Support (Zendesk)**: Ticket dashboards, SLA alerts, issue trends.

---

## 🏗️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: BetterAuth (JWT-based with OAuth support for tool integrations)
- **Payments**: Polar.sh for subscription management
- **Email**: Resend
- **UI**: React + shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd productstack
```
````

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Configure your `.env` file:

```env
BETTER_AUTH_SECRET=your_secret_key_here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# Polar.sh Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token_here
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret_here
NEXT_PUBLIC_FREE_PLAN_ID=your_free_plan_id_here
NEXT_PUBLIC_PRO_PLAN_ID=your_pro_plan_id_here

# Email
RESEND_API_KEY=your_resend_api_key_here

# OAuth for Tool Integrations
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
JIRA_CLIENT_ID=your_jira_client_id_here
JIRA_CLIENT_SECRET=your_jira_client_secret_here
SLACK_CLIENT_ID=your_slack_client_id_here
SLACK_CLIENT_SECRET=your_slack_client_secret_here
# Add similar for Notion, Mixpanel, Intercom, Figma, GitHub, Zendesk
```

4. Generate Prisma client and push schema:

```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

---

## � stickiness note

For the complete project structure, please refer to the original README in the provided Markdown.

---

## 🔍 Key Implementation Details

### 1. User-Centric Architecture

**Approach**: Single-tenant architecture with user-scoped data isolation via `userId`. All queries are filtered by the authenticated user’s ID to ensure data privacy.

**Schema Example** (from `prisma/schema.prisma`):

```prisma
model ProjectTask {
  id           String      @id @default(uuid())
  userId       String
  externalId   String      // Jira ticket ID
  title        String
  status       Status
  priority     Priority
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### 2. Authentication Flow

1. User logs in via `/api/auth/login` or OAuth (e.g., Google, tool-specific OAuth).
2. JWT token generated and validated by middleware.
3. User’s tool integrations (via OAuth) loaded for data syncing.

### 3. Subscription Feature Gating

**Free Plan Limits**:

- 3 tool integrations
- 50 items per category (e.g., tasks, messages)

**Pro Plan**:

- Unlimited integrations and items
- Accessible to users with admin roles

### 4. API Endpoints

All endpoints enforce user isolation:

- `POST /api/tasks` - Create Jira task
- `GET /api/messages` - List Slack messages
- `GET /api/documents` - List Notion documents
- `GET /api/metrics` - Fetch Mixpanel metrics
- `POST /api/feedback` - Log Intercom feedback
- `GET /api/designs` - List Figma designs
- `GET /api/code-items` - Fetch GitHub PRs/issues
- `PUT /api/tickets` - Update Zendesk tickets

---

## 🎯 Development Guidelines

### Code Organization Pattern

1. **Business Logic**: Write operations in `src/server/` (e.g., `tasks.ts`, `metrics.ts`).
2. **API Routes**: Thin wrappers in `src/app/api/` calling server functions.
3. **State Updates**: Update Zustand stores after mutations.
4. **Type Safety**: Define interfaces in `src/types/`.

### Example Workflow

```typescript
// src/server/tasks.ts
export async function createTask(data: CreateTaskInput) {
	// Business logic with userId scoping
}

// src/app/api/tasks/route.ts
export async function POST(request: Request) {
	const result = await createTask(data);
	return NextResponse.json(result);
}

// Component
const addTask = async (data) => {
	const task = await fetch("/api/tasks", {
		method: "POST",
		body: JSON.stringify(data),
	});
	tasksStore.addTask(task); // Update Zustand
};
```

### Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run lint             # Run ESLint
npm run build            # Production build

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes
npx prisma studio        # Open database GUI
```

---

## 🌐 API Reference

### Health Check

```http
GET /api/health
Response: { "status": "ok" }
```

### Authentication

```http
POST /api/auth/login
Body: { "email": "pm@company.test", "password": "password" }
Response: { "token": "jwt-token", "user": {...} }
```

### Sample Endpoint (Tasks)

```http
# Create Task
POST /api/tasks
Headers: { "Authorization": "Bearer <token>" }
Body: { "title": "New Feature", "status": "TODO" }

# List Tasks
GET /api/tasks
Headers: { "Authorization": "Bearer <token>" }
```

---

## 🚢 Deployment

### Vercel Deployment

1. Push code to GitHub.
2. Import project in Vercel.
3. Configure environment variables.
4. Deploy.

### Environment Variables for Production

```env
BETTER_AUTH_SECRET=your_production_secret_here
BETTER_AUTH_URL=https://productstack.app
NEXT_PUBLIC_APP_URL=https://productstack.app
DATABASE_URL="postgresql://..."

POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
NEXT_PUBLIC_FREE_PLAN_ID=your_free_plan_id
NEXT_PUBLIC_PRO_PLAN_ID=your_pro_plan_id

RESEND_API_KEY=your_resend_api_key
# Add OAuth credentials for all 8 tools
```

### Database Setup

```bash
npx prisma db push
```

---

## 🧪 Testing

**Automated Test Coverage**:

- ✅ Health endpoint
- ✅ Authentication and OAuth flows
- ✅ User-scoped data isolation
- ✅ Subscription limits
- ✅ CRUD operations for all categories
- ✅ Frontend accessibility

---

## 📋 Features Checklist

- [x] User-scoped data architecture
- [x] JWT + OAuth authentication
- [x] Free/Pro subscription tiers
- [x] Integrations with 8 tools
- [x] Real-time syncing (webhooks/polling)
- [x] Cross-tool insights
- [x] Customizable views
- [x] Universal search
- [x] Responsive UI
- [x] Vercel deployment

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-integration`).
3. Write logic in `src/server/`.
4. Ensure queries include `userId` filtering.
5. Update Zustand stores post-mutation.
6. Commit, push, and open a Pull Request.

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 📞 Support

- Open a GitHub issue.
- Review `src/server/` for implementation details.
- Contact support@productstack.app.
