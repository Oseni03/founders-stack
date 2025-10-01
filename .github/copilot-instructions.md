# NoteApp Copilot Instructions

This document provides instructions for AI coding agents to effectively contribute to the NoteApp codebase - a multi-tenant SaaS notes application built with Next.js App Router.

## Architecture Overview

- **Framework**: Next.js 14+ (App Router) with co-located frontend/backend
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with `better-auth` library
- **UI**: React with shadcn/ui components + Tailwind CSS
- **State**: Zustand for global client-side state
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## Key Concepts

### 1. Multi-Tenant Architecture

- **Design**: Shared database, shared schema with tenant isolation
- **Critical**: All data access MUST filter by `organizationId`
- **Plans**: Free (3 user/50 note limit) vs Pro (unlimited) - See `src/lib/utils.ts`

Example tenant isolation:

```ts
// In src/server/notes.ts
const notes = await prisma.note.findMany({
	where: { organizationId: activeOrganization.id },
});
```

### 2. Code Organization

- **Business Logic**: `src/server/` - Single source of truth
- **API Routes**: Thin wrappers in `src/app/api/` calling server functions
- **Components**:
    - UI primitives: `src/components/ui/`
    - Forms: `src/components/forms/`
    - Layout: `src/components/` root
- **State**: Zustand stores in `src/zustand/`
- **Types**: Shared interfaces in `src/types/`

### 3. Authentication & Authorization

- **Core**: JWT auth with middleware (`src/lib/middleware.ts`)
- **Roles**: `admin` vs `member` determining permissions
- **Flow**:
    1. `src/lib/auth.ts` - Core auth logic
    2. `useAuthState` hook - Client-side session
    3. Role checks via `isAdmin` helper

### 4. State Management Pattern

1. Define mutations in `src/server/` functions
2. Call via API routes/Server Actions
3. Update Zustand store on success
4. Trigger UI updates through store subscriptions

Example:

```tsx
// In a component
const removeMember = async (id: string) => {
	const result = await deleteMember(id);
	if (result.success) {
		organizationStore.removeMember(id); // Update local state
	}
};
```

### 5. Development Workflow

```bash
# Initial setup
npm install
npx prisma generate

# Development
npm run dev         # Start dev server
npm run lint        # Run ESLint
npm run build      # Build + generate Prisma

# Database
npx prisma generate # After schema changes
```

### 6. Test Accounts

All accounts use password: `password`

- `admin@acme.test`: Admin role (Acme tenant)
- `user@acme.test`: Member role (Acme tenant)
- `admin@globex.test`: Admin role (Globex tenant)
- `user@globex.test`: Member role (Globex tenant)

## Critical Files

- `prisma/schema.prisma`: Database schema
- `src/server/*.ts`: Core business logic
- `src/lib/auth.ts`: Authentication system
- `src/zustand/providers/organization-store-provider.ts`: Global state
- `src/app/api/*/route.ts`: API endpoints
