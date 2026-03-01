# Architecture & Feature Reference

A comprehensive guide to the bhvr-monorepo-template — covering every feature, implementation choice, and design decision. Use this to understand the system deeply or replicate it in a different stack.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Tech Stack Rationale](#3-tech-stack-rationale)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [Authorization System](#6-authorization-system)
7. [API Layer](#7-api-layer)
8. [Web App Architecture](#8-web-app-architecture)
9. [Data Fetching Architecture](#9-data-fetching-architecture)
10. [Core Features](#10-core-features)
11. [Cross-Cutting Concerns](#11-cross-cutting-concerns)
12. [Design System](#12-design-system)
13. [Replication Guide](#13-replication-guide)

---

## 1. Project Overview

This template is a **production-grade SaaS admin platform** with user management, role-based access control, audit logging, and runtime configuration — all wired together in a full-stack TypeScript monorepo.

**Core capabilities:**
- Multi-session JWT authentication with automatic token refresh
- Admin impersonation with full audit trail
- Hierarchical role + attribute-based authorization (RBAC + ABAC)
- Paginated user, role, and invitation management
- Runtime configuration editor (without redeploy)
- Comprehensive audit log viewer
- Per-user preferences (theme, locale, sidebar) persisted to the database
- i18n-ready frontend

---

## 2. Monorepo Structure

```
bhvr-monorepo-template/
├── apps/
│   ├── api/           # Hono REST API (port 3000)
│   └── web/           # React + TanStack Router (port 5173)
├── packages/
│   ├── shared/        # Domain logic: models, queries, schemas, auth
│   ├── react/         # UI component library (Radix + Tailwind)
│   ├── eslint-config/ # Shared lint rules
│   └── typescript-config/ # Shared tsconfig bases
├── docs/
├── turbo.json         # Build pipeline
├── compose.yml        # PostgreSQL via Docker
└── bun.lock
```

**Why this split?**

| Package | Purpose |
|---|---|
| `shared` | Code that both the API and web need: schemas, types, DB queries, auth logic |
| `react` | UI primitives that can be reused across multiple web apps |
| `api` | Only the HTTP layer — route handlers, middleware, server startup |
| `web` | Only the frontend — pages, layouts, data-fetching hooks |

Turborepo orchestrates builds with proper dependency ordering and caching. Because `shared` is referenced by both `api` and `web`, it always builds first.

---

## 3. Tech Stack Rationale

### Runtime & Build

| Choice | Why |
|---|---|
| **Bun** | Faster installs and native TypeScript execution — no separate build step for the API in dev |
| **Turborepo** | Parallelizes tasks across packages, caches build artifacts |
| **TypeScript strict** | All packages use `strict: true`. Errors surface at compile time, not runtime |

### API

| Choice | Why |
|---|---|
| **Hono** | Lightweight, edge-compatible, excellent TypeScript support with the RPC client (Hono client syncs types to the frontend automatically) |
| **Drizzle ORM** | Type-safe SQL with migrations, no magic — queries look like SQL |
| **PostgreSQL** | Reliable relational database; JSON columns used for preferences and metadata |
| **Zod v4** | Schema-first validation; same schemas used for DB types and API input validation |

### Web

| Choice | Why |
|---|---|
| **React 19** | Server actions and concurrent features available |
| **TanStack Router** | Type-safe file-based routing with `beforeLoad` guards for auth/permission checks |
| **TanStack Query** | Caching, background refetching, and cache invalidation — replaces manual fetch state |
| **Vite** | Fast HMR; proxies `/api` to the API server in development |
| **Tailwind CSS v4** | Utility-first with the new Vite plugin (no PostCSS config needed) |

---

## 4. Database Schema

All IDs use **Nanoid** (21-character URL-safe strings), except roles which use serial integers for ordering.

### Tables

#### `users`

```
id            nanoid(21)     PK
email         varchar(255)   UNIQUE NOT NULL
firstName     varchar(255)
lastName      varchar(255)
password      text           (bcrypt hash via Bun.password)
avatar        text           (URL)
preferences   jsonb          { sidebar: bool, theme: system|light|dark, locale: string }
metadata      jsonb          (arbitrary extensible data)
verifiedAt    timestamp
createdAt     timestamp      DEFAULT now()
updatedAt     timestamp      DEFAULT now() (auto-update)
```

#### `roles`

```
id            serial         PK
name          varchar(255)   UNIQUE NOT NULL
index         integer        UNIQUE (used for ordering/hierarchy)
isDefault     boolean        DEFAULT false (assigned on register)
isSuperAdmin  boolean        DEFAULT false (bypasses all permission checks)
createdAt     timestamp
updatedAt     timestamp
```

#### `user_roles` (junction)

```
userId        FK → users.id  CASCADE DELETE
roleId        FK → roles.id  CASCADE DELETE
PK (userId, roleId)
```

#### `tokens`

```
id            nanoid(21)     PK
userId        FK → users.id  CASCADE DELETE
type          enum           access | refresh | verification
issuedAt      timestamp
expiresAt     timestamp
revokedAt     timestamp      (null = active)
userAgent     text
ip            text
```

Refresh tokens are persisted to this table. This enables:
- Session listing per user
- Individual session revocation
- Revoking all sessions on password change

#### `role_permissions` (junction)

```
roleId        FK → roles.id  CASCADE DELETE
permission    varchar(255)
PK (roleId, permission)
```

Permission strings follow `resource:action` format (e.g. `user:delete`, `role:create`).

#### `invitations`

```
id            nanoid(21)     PK
email         varchar(255)
token         text           UNIQUE (hex string, used in invitation link)
status        enum           pending | accepted | expired | revoked
expiresAt     timestamp      (7 days from creation)
invitedById   FK → users.id
autoValidateEmail boolean    (mark user as verified on accept)
acceptedAt    timestamp
createdAt     timestamp
updatedAt     timestamp
```

#### `audit_logs`

```
id            nanoid(21)     PK
action        varchar(255)   (e.g. "user.login", "user.delete")
actorId       varchar(255)   (denormalized — no FK)
impersonatorId varchar(255)  (set when action was performed via impersonation)
targetId      varchar(255)   (the resource being acted upon)
targetType    varchar(255)
metadata      text           (JSON string)
ip            text
userAgent     text
createdAt     timestamp
```

> Audit logs are intentionally **denormalized** — no foreign keys. This ensures the log is immutable and survives user deletion.

#### `runtime_configs`

```
configKey     varchar(255)   PK
value         text
type          enum           string | number | boolean | list
nullable      boolean
options       jsonb          (allowed values for list types)
disabledWhen  text           (another configKey that disables this one)
order         integer        (display order in the UI)
updatedAt     timestamp
updatedBy     FK → users.id
```

#### `cron_tasks`

```
id            nanoid(21)     PK
name          varchar(255)
description   text
cronExpression text
handler       varchar(255)   (maps to registered handler function)
isEnabled     boolean
lastRunAt     timestamp
nextRunAt     timestamp
createdAt     timestamp
updatedAt     timestamp
```

#### `cron_task_runs`

Execution history per cron task — status, duration, error message.

#### `policies`

Fine-grained ABAC policy definitions. Each policy is attached to a role and evaluated at authorization time. See [policies.md](./policies.md) for details.

### Entity Relationship Summary

```
users ──M:M── roles ──M:M── role_permissions
  │               └──M:M── policies
  │
  ├── tokens (1:M)
  ├── invitations (1:M, as invitedBy)
  └── user_roles (junction)

runtime_configs.updatedBy → users.id
audit_logs (denormalized, no FK)
```

---

## 5. Authentication System

### Token Architecture

Two JWTs are issued on every successful login:

| Token | Lifetime | Storage | Purpose |
|---|---|---|---|
| **Access Token** | 15 minutes | HTTP-only cookie | Authenticate every request |
| **Refresh Token** | 30 days | HTTP-only cookie + DB record | Silently refresh expired access tokens |

The access token payload:
```json
{
  "sub": "userId",
  "ttyp": "access",
  "iat": 1234567890,
  "exp": 1234568790,
  "iss": "bunstack",
  "impersonatorId": "adminUserId"  // optional, for impersonation
}
```

The refresh token payload:
```json
{
  "sub": "userId",
  "jti": "tokenRecordId",
  "ttyp": "refresh",
  "iat": 1234567890,
  "exp": 1234597890,
  "iss": "bunstack"
}
```

The `jti` (JWT ID) links the token to a row in the `tokens` table, allowing revocation.

### Cookie Security

```typescript
{
  httpOnly: true,           // not readable by JS
  path: "/",
  secure: true,             // HTTPS only in production
  sameSite: "None",         // cross-origin safe in production
             // or "Lax" in development
  domain: ".yourdomain.com" // shared across subdomains in production
}
```

### Automatic Token Refresh

Every authenticated request goes through `getSessionContext` middleware:

1. Try to verify the access token from the cookie
2. If valid → continue with the user session
3. If expired → check the refresh token cookie
4. If refresh token is valid and not revoked in DB → issue a new access token, set the new cookie, continue

This is transparent to the client — no explicit refresh calls needed.

> **Important:** On refresh, impersonation state is **not carried over**. Impersonation only lasts for one access token lifetime (15 minutes). This is intentional — it limits the blast radius of an impersonation session.

### Auth Flows

**Register:**
1. Validate email uniqueness + password strength (8+ chars, upper, lower, number, symbol)
2. Hash password with `Bun.password.hash()` (uses argon2id by default)
3. Create user with the default role
4. Issue access + refresh tokens
5. Write audit log

**Login:**
1. Find user by email
2. Verify password with `Bun.password.verify()` (constant-time)
3. Add a 500ms minimum response time (prevents timing-based user enumeration)
4. Create refresh token record in DB
5. Issue access + refresh tokens
6. Write audit log (success or failure)

**Logout:**
1. Delete refresh token from DB (revokes the session)
2. Clear both cookies
3. Write audit log

**Password Change:**
1. Verify current password
2. Hash new password
3. Revoke **all** refresh tokens except the current session
4. Update password hash
5. Write audit log

### Session Management

- `GET /auth/sessions` — list all active sessions for the current user (or a specific user for admins)
- `DELETE /auth/sessions/:tokenId` — revoke a specific session
- `DELETE /auth/sessions` — revoke all sessions

Used by the admin panel to manage multi-device access.

### Impersonation

```
POST /auth/impersonate/:userId
```

- Requires `user:impersonate` permission
- Cannot impersonate self or when already impersonating
- Creates a new access token with `impersonatorId` set
- The original admin's session remains untouched
- All actions performed while impersonating are logged with both `actorId` (impersonated user) and `impersonatorId` (actual admin)

```
POST /auth/stop-impersonation
```

- Reissues an access token for the original admin without `impersonatorId`

---

## 6. Authorization System

### Two Layers

**RBAC (Role-Based Access Control)**
- Each role has a set of permission strings (e.g. `user:delete`, `role:create`)
- Users inherit permissions from all their roles
- SuperAdmin roles bypass all permission checks

**ABAC (Attribute-Based Access Control)**
- Policies attached to roles that can evaluate resource attributes
- Example: "a user can update their own profile but not others"
- See [policies.md](./policies.md) for the policy DSL

### Permission Strings

```
auth:*
user:read | user:list | user:update | user:delete | user:impersonate
role:read | role:list | role:create | role:delete
userRole:create | userRole:delete
invitation:read | invitation:list | invitation:create | invitation:delete | invitation:revoke
auditLog:list | auditLog:delete
session:list | session:revoke
runtimeConfig:update
cron:read | cron:list | cron:create | cron:update | cron:delete
```

### Checking Authorization

```typescript
// Single permission check
const allowed = isAuthorized("user:delete", currentUser, targetUser);

// Batch check (for UI: which buttons to show)
const results = isAuthorizedBatch([
  { permission: "user:update" },
  { permission: "user:delete", resource: targetUser },
], currentUser);
```

The batch check is used by the frontend to conditionally render action buttons. A single API call returns all authorization decisions at once, avoiding per-button round-trips.

### API Middleware

```typescript
// Protecting a route
.delete("/:id", requirePermission("user:delete"), async (c) => { ... })

// With resource-level check (ABAC)
.put("/:id", requirePermission("user:update", (c) => getTargetUser(c)), async (c) => { ... })
```

`requirePermission` middleware:
1. Extracts the current session from context
2. Calls `isAuthorized(permission, user, resource?)`
3. Returns 403 if denied + writes an audit log entry

---

## 7. API Layer

### Structure

```
apps/api/src/
├── index.ts          # Server entry: seeds, cron, Bun.serve()
├── app.ts            # Hono app: global middleware, route mounting
├── routes/
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   ├── roles.routes.ts
│   ├── invitations.routes.ts
│   ├── audit-logs.routes.ts
│   ├── runtime-configs.routes.ts
│   └── cron-tasks.routes.ts
├── middlewares/
│   ├── auth.ts           # getSessionContext: verifies JWT, auto-refresh
│   ├── access-control.ts # requirePermission factory
│   ├── validation.ts     # Zod validation wrapper
│   ├── rate-limit.ts     # In-memory rate limiter
│   ├── audit.ts          # auditList / auditRead helpers
│   └── cors.ts           # Dynamic CORS (reads runtime_configs)
└── lib/
    ├── jwt.ts            # createToken, verifyToken
    ├── auth.ts           # getSessionContext, setTokenCookies
    └── session.ts        # Cookie settings per environment
```

### Response Format

All endpoints return consistent JSON:

```typescript
// Success
{ success: true }
{ success: true, data: { ... } }

// Paginated
{
  success: true,
  items: [...],
  pagination: { page, limit, total, pageCount }
}

// Error
{ success: false, error: "Human-readable message" }
```

HTTP status codes follow REST conventions: 200, 201, 400, 401, 403, 404, 409, 429, 500.

### Rate Limiting

Three tiers:
- **Strict** (login, register): Very low limit, short window
- **Standard** (authenticated API): Moderate limit
- **Public** (invite acceptance): Separate limit

Rate limit information is always returned in headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1234567890
Retry-After: 60  (only on 429)
```

### Validation

Every route with a body or query params uses a Zod schema:

```typescript
.post("/register", validate(RegisterSchema), async (c) => {
  const body = c.req.valid("json"); // typed from RegisterSchema
  ...
})
```

The `validate` middleware calls `safeParse`, returns 400 with field-level errors if invalid.

### Startup Sequence

On server start (`index.ts`):
1. Connect to PostgreSQL via Drizzle
2. Run database seeds (idempotent — only insert if not exists)
3. Register cron tasks
4. Start `Bun.serve()` on port 3000

Seeds create: default runtime configs, roles (admin + user), policies, and demo users.

---

## 8. Web App Architecture

### Routing

File-based routing via TanStack Router:

```
src/routes/
├── __root.tsx               # Root layout + router context (queryClient, session)
├── _auth/
│   ├── route.tsx            # Auth layout (split-panel)
│   ├── login/
│   │   ├── route.tsx
│   │   └── components/
│   └── register/
│       ├── route.tsx
│       └── components/
├── _dashboard/
│   ├── route.tsx            # Dashboard layout (sidebar + header)
│   ├── index.tsx            # / dashboard home
│   ├── users/
│   │   ├── route.tsx        # /users list
│   │   ├── $userId/
│   │   │   └── route.tsx    # /users/:id detail
│   │   └── components/
│   ├── logs/
│   │   ├── route.tsx        # /logs audit log viewer
│   │   └── components/
│   └── settings/
│       ├── route.tsx        # /settings runtime config editor
│       └── components/
└── accept-invitation.tsx    # /accept-invitation (public)
```

### Route Guards

`beforeLoad` on protected routes:

```typescript
// Dashboard layout — checks user is authenticated
beforeLoad: async ({ context }) => {
  const session = await context.queryClient.fetchQuery(sessionQueryOptions);
  if (!session) throw redirect({ to: "/login" });
  return { session };
}

// Users route — checks permission
beforeLoad: async ({ context }) => {
  const allowed = await isAuthorizedQuery(context.queryClient, "user:list");
  if (!allowed) throw redirect({ to: "/" });
}
```

### Layout Structure

**Dashboard Layout** (`_dashboard/route.tsx`):
- Reads `user.preferences` from the session
- Applies theme and locale from preferences on mount
- Renders: `SidebarProvider` → `AppSidebar` + `ImpersonationBanner` + `Outlet`
- Writes back sidebar state to user preferences on toggle

**Auth Layout** (`_auth/route.tsx`):
- Left panel: dark background with orange glow gradient (branding)
- Right panel: form with Card component

### Component Organization

```
src/
├── api/           # Data layer (per resource)
├── hooks/         # Custom hooks (per resource)
├── components/
│   ├── layout/    # Sidebar, nav, header, impersonation banner
│   └── ...        # Shared UI components
└── routes/        # Pages (each has co-located components/)
```

---

## 9. Data Fetching Architecture

Every resource follows a strict 5-layer pattern.

### Layer 1: Query Keys

```typescript
// api/users/users.keys.ts
export const usersKeys = {
  all: ["users"] as const,
  paginated: ["users", "paginated"] as const,
  byId: (id: string) => ["users", "byId", id] as const,
  relations: (ids: string[], include: RelationKey[]) =>
    ["users", "relations", { ids, include }] as const,
};
```

Keys are factory functions so the cache can be precisely invalidated.

### Layer 2: API Functions

```typescript
// api/users/users.api.ts
export async function fetchPaginatedUsers(params: PaginationParams) {
  const res = await api.users.$get({ query: params });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}
```

`api` is a Hono RPC client — types are inferred from the server route definitions, so incorrect query params or body shapes are TypeScript errors.

### Layer 3: Query Options

```typescript
// api/users/users.queries.ts
export const paginatedUsersQueryOptions = paginatedQueryOptions({
  queryKey: usersKeys.paginated,
  queryFn: fetchPaginatedUsers,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST, // 5 minutes
});

export function userQueryOptions(id: string) {
  return queryOptions({
    queryKey: usersKeys.byId(id),
    queryFn: () => fetchUser(id),
    staleTime: QUERY_STALE_TIMES.SINGLE_ITEM, // 2 minutes
  });
}
```

### Layer 4: Mutation Options

```typescript
// api/users/users.mutations.ts
export function updateUserMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.byId(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
    },
  };
}
```

Mutation options are pure (no toast/i18n) so they can be reused without UI side effects.

### Layer 5: Custom Hooks

```typescript
// hooks/users/use-update-user.tsx
export function useUpdateUser() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...updateUserMutationOptions(queryClient),
    onSuccess: () => toast.success(t("pages.users.actions.updateSuccess")),
    onError: () => toast.error(t("pages.users.actions.updateError")),
  });
}
```

Hooks add the UI layer (toast, i18n) on top of the reusable base options.

### Stale Times

| Data Type | Stale After |
|---|---|
| Auth session | Never (Infinity) |
| Paginated lists | 5 minutes |
| Single items | 2 minutes |
| Relations | 3 minutes |
| Validation | 1 minute |
| Runtime config | 10 minutes |

### Relation Loading

To avoid N+1 queries, relations (user roles, sessions, etc.) are loaded in batch:

```typescript
// api/users/users.relations.api.ts
export async function fetchUsersRelations(ids: string[], include: RelationKey[]) {
  const res = await api.users.relations.$post({ json: { ids, include } });
  return res.json();
}
```

A single request loads all needed relations for a list of items.

---

## 10. Core Features

### User Management

**List view:**
- Server-side pagination (page, limit, total, pageCount)
- Search by name/email
- Sort by any column
- Per-row action menu

**User detail:**
- Edit profile (name, email, avatar)
- Admin reset password (generates random password, revokes other sessions)
- Assign/remove roles
- View active sessions → revoke individual or all
- Delete user

**Access control on actions:**
- The frontend checks permissions via `isAuthorizedBatch` before rendering action buttons
- The API enforces the same permissions independently

### Role Management

- List all roles (paginated)
- Create role with name
- View role → list members, assign/remove users
- Delete role (cascades user_roles and role_permissions)

### Invitations

- Create invitation for an email address with pre-selected roles
- Optional `autoValidateEmail` flag (marks user as verified on acceptance)
- 7-day expiration enforced server-side
- Invitation link contains a hex token
- `GET /invitations/accept?token=...` → public endpoint validates and returns invitation details
- `POST /invitations/accept` → creates the user account, assigns roles, marks invitation accepted
- Admin can revoke or delete pending invitations

### Audit Logs

All sensitive actions are logged:

| Action | Logged When |
|---|---|
| `user.register` | New account created |
| `user.login` | Successful login |
| `user.login.failed` | Failed login attempt |
| `user.logout` | Session ended |
| `user.update` | Profile changed |
| `user.delete` | User deleted |
| `user.password.change` | Password updated |
| `user.impersonate` | Impersonation started |
| `user.impersonate.stop` | Impersonation ended |
| `user.role.assign` | Role given to user |
| `user.role.remove` | Role removed from user |
| `invitation.create` | Invitation sent |
| `invitation.accept` | Invitation accepted |
| `invitation.revoke` | Invitation revoked |
| `permission.denied` | Authorization failed |
| `session.revoke` | Session manually ended |
| `runtimeConfig.update` | Config value changed |

The audit log viewer supports pagination and filtering by action type. Requires `auditLog:list` permission.

### Runtime Configuration

A key-value store that admins can update without redeploying:

```typescript
type RuntimeConfig = {
  configKey: string;
  value: string | null;
  type: "string" | "number" | "boolean" | "list";
  nullable: boolean;
  options: string[] | null;    // allowed values for "list" type
  disabledWhen: string | null; // configKey that disables this config
  order: number;
}
```

Seeded with defaults. The frontend renders each config as the appropriate input (toggle for boolean, select for list, text for string/number). All changes are audit-logged.

### User Preferences

Stored in a `jsonb` column on the `users` table:

```typescript
type UserPreferences = {
  sidebar: boolean;   // open or collapsed
  theme: "system" | "light" | "dark";
  locale: string;     // BCP 47 language tag
}
```

**Flow:**
1. Dashboard layout reads preferences from the session on mount
2. Applies theme and locale immediately
3. Any change (sidebar toggle, theme switch, locale change) fires `PATCH /auth/preferences`
4. Next session load picks up the persisted preferences

---

## 11. Cross-Cutting Concerns

### Internationalization (i18n)

- Library: `i18next` + `react-i18next`
- Translation files organized per namespace (e.g. `web`)
- Keys follow page hierarchy: `pages.users.actions.updateSuccess`
- Language detection from user preferences
- All user-facing strings in mutation hooks go through `t()`

### Error Handling

**API:**
- Hono `onError` handler catches all unhandled errors
- Zod validation errors return 400 with structured field errors
- Auth errors return 401
- Permission errors return 403 + audit log

**Web:**
- TanStack Query `onError` surfaces in mutation hooks as toast notifications
- `ErrorBoundary` at the route level for render errors
- The `sayno.tsx` component handles full-page errors

### Security Practices

| Practice | Implementation |
|---|---|
| Password hashing | `Bun.password.hash()` (argon2id) |
| Timing attack prevention | Minimum 500ms login response |
| XSS prevention | HTTP-only cookies, no token in localStorage |
| CSRF prevention | `SameSite=None` + `httpOnly` cookies |
| Session fixation | New token issued on login |
| Token revocation | DB-tracked refresh tokens |
| Rate limiting | Per-route in-memory limits |
| Input validation | Zod on every route with a body |
| Audit trail | All sensitive actions logged |
| Impersonation tracking | Separate `impersonatorId` field |

---

## 12. Design System

See [MEMORY.md](../../../.claude/projects/-Users-gabrielhalus-Developer-bhvr-monorepo-template/memory/MEMORY.md) for full token values. Summary:

**Color System ("Neutral + Ember Accent"):**
- Primary accent: `oklch(0.640 0.222 42)` — warm amber-orange
- Light background: `oklch(0.995 0 0)` — near white
- Dark background: `oklch(0.090 0.008 265)` — cool-neutral near black
- All neutrals use hue 265 (cool violet-gray) at very low chroma

**Typography:**
- Headings/UI: Bricolage Grotesque (variable, 200–800 weight)
- Code/mono: JetBrains Mono
- Tracking: `-0.02em` globally

**Radius Scale:**
- `rounded-lg` — inputs, select triggers
- `rounded-xl` — dropdowns, select content
- `rounded-2xl` — dialogs, hero panels, cards

**Component Patterns:**
- **Hero panels**: every dashboard page has a decorative header panel with grid overlay + blur orb
- **Page layout**: `flex-col gap-6 p-6 md:p-8` wrapper with hero panel as first child
- **Tables**: `text-xs font-semibold uppercase tracking-wider` column headers
- **Active nav item**: `shadow-[inset_2px_0_0_var(--color-sidebar-primary)]` left border indicator

---

## 13. Replication Guide

If you want to build the same system in a different stack, here is what you need:

### Auth System (must-haves)

1. **Two-token architecture** — short-lived access token (15min) + long-lived refresh token (30 days)
2. **Refresh tokens persisted to DB** — enables revocation, session listing, forced logout
3. **HTTP-only cookies** — prevents XSS from stealing tokens
4. **Automatic refresh middleware** — intercept requests, check if access token is expired, issue new one from refresh token before the request hits the handler
5. **Constant-time login** — always wait a minimum time regardless of whether user exists
6. **Argon2 or bcrypt** — never MD5/SHA for passwords

### Authorization System (must-haves)

1. **Permission strings** — `resource:action` format, attached to roles
2. **SuperAdmin bypass** — roles with `isSuperAdmin` skip all checks
3. **Middleware factory** — `requirePermission(permission)` wraps route handlers
4. **Batch authorization** — one API call returns multiple permission decisions for the UI
5. **Resource-level checks** — some permissions require the resource (e.g. "can update own profile")

### Data Layer (recommendations)

1. **Separate query functions from HTTP handlers** — queries in a shared package, imported by both API and web
2. **Nanoid or ULID for IDs** — avoid auto-increment for security and distributed use
3. **JSON column for preferences** — avoids a separate preferences table for simple key-value user data
4. **Denormalized audit logs** — no FK constraints, store entity names/emails at log time

### Frontend Data Fetching (recommendations)

1. **Query key factories** — structured keys enable precise cache invalidation
2. **Separate query/mutation options from hooks** — options are reusable (e.g. in `beforeLoad` loaders), hooks add UI side effects
3. **Stale time by data type** — auth data never stales; lists stale in 5min; single items in 2min
4. **Batch relation loading** — never load relations in a loop; send a single request with a list of IDs

### API Design (recommendations)

1. **Consistent response envelope** — always `{ success, data? }` or `{ success, error }` + correct HTTP status
2. **Rate limit headers** — always include `X-RateLimit-*` headers so clients can back off gracefully
3. **Pagination format** — return `{ items, pagination: { page, limit, total, pageCount } }` consistently
4. **Idempotent seeds** — seeds run on every startup; use `INSERT ... ON CONFLICT DO NOTHING`

### What to Seed

1. **Default roles**: at minimum `admin` (with all permissions) and `user` (basic read access), with `isDefault: true` on the user role
2. **Runtime configs**: CORS allowed origins, feature flags, any env-dependent config
3. **Policies**: ABAC rules for "can edit own profile" etc.
4. **Demo admin user**: email + known password so the system is immediately usable

---

*Generated from codebase analysis. For environment variables, see [env.md](./env.md). For runtime config details, see [runtime-configs.md](./runtime-configs.md). For ABAC policy syntax, see [policies.md](./policies.md).*
