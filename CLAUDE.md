# CLAUDE.md

This is a **bunstack** monorepo template using Bun, Turbo, TypeScript, Hono (API), and React (Web).

## Project Structure

```
├── apps/
│   ├── api/          # Hono REST API server
│   └── web/          # React + TanStack Router dashboard
├── packages/
│   ├── shared/       # Core domain logic, DB models, queries, schemas
│   ├── react/        # Reusable UI component library
│   ├── typescript-config/
│   └── eslint-config/
```

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Runtime  | Bun 1.2.13, Node >=18                           |
| Build    | Turbo, TypeScript 5.8 (strict)                  |
| API      | Hono, Drizzle ORM, PostgreSQL, Zod             |
| Web      | React 19, Vite, TanStack (Router/Query/Form/Table), Tailwind CSS |
| UI       | Radix UI primitives, Framer Motion, Lucide icons |

## Code Conventions

### File Naming
- **kebab-case** for all files: `user-roles.model.ts`, `use-paginated-users.tsx`
- Models: `{entity}.model.ts`
- Routes: `{resource}.routes.ts`
- Queries: `{resource}.queries.ts`
- Hooks: `use-{feature}-{action}.tsx`
- Schemas: `{entity}.schema.ts`

### TypeScript
- **camelCase** for variables/functions
- **PascalCase** for components/types
- Use `type` over `interface`
- Semicolons required, double quotes, 2-space indent

### Zod Schemas
- Base: `{Entity}Schema`
- Insert: `Insert{Entity}Schema`
- Update: `Update{Entity}Schema`
- Located in `schemas/api/` or `schemas/db/`

### React Components
- Functional components only
- Props type: `{ComponentName}Props`
- Named exports with compound pattern: `export { Avatar, AvatarFallback, AvatarImage }`
- Use `data-slot="component-name"` on root elements

### Import Order (auto-sorted by ESLint)
1. Type imports (`import type ...`)
2. External packages
3. Internal aliases (`@bunstack/`, `@/`, `~shared/`, `~react/`)
4. Relative imports

### Path Aliases
- `@/*` → local app `./src/*`
- `~shared/*` → `packages/shared/src/*`
- `~react/*` → `packages/react/src/*`

## API Patterns

### Response Format
```typescript
// Success
{ success: true }
{ success: true, data: {...} }

// Error
{ success: false, error: "message" }
```

### Route Handler Style
```typescript
/**
 * Description of the endpoint
 * @param c - The Hono context object
 * @returns JSON response
 */
.post("/endpoint", validationMiddleware(schema), async (c) => { ... })
```

## Query Management (TanStack Query)

The web app uses a layered architecture for data fetching with TanStack Query.

### File Structure (per resource)

```
apps/web/src/
├── api/{resource}/
│   ├── {resource}.keys.ts       # Query key factories
│   ├── {resource}.api.ts        # Fetch functions
│   ├── {resource}.queries.ts    # Query options
│   └── {resource}.mutations.ts  # Mutation options
└── hooks/{resource}/
    ├── use-{resource}.tsx           # Single item query hook
    ├── use-paginated-{resource}.tsx # Paginated query hook
    ├── use-update-{resource}.tsx    # Mutation hook
    └── use-delete-{resource}.tsx    # Mutation hook
```

### 1. Query Keys (`{resource}.keys.ts`)

```typescript
const usersRootKey = ["users"] as const;

export const usersKeys = {
  all: usersRootKey,
  paginated: [...usersRootKey, "paginated"] as const,
  byId: (userId: string) => ["users", "byId", userId] as const,
  relations: (ids: string[], include: RelationKey[]) =>
    ["users", "relations", { ids, include }] as const,
};
```

### 2. API Functions (`{resource}.api.ts`)

```typescript
import { api } from "~react/lib/http";

export async function fetchPaginatedUsers(params: PaginationParams) {
  const res = await api.users.$get({ query: { ... } });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}
```

### 3. Query Options (`{resource}.queries.ts`)

```typescript
import { queryOptions } from "@tanstack/react-query";
import { QUERY_STALE_TIMES } from "../query-config";

export const paginatedUsersQueryOptions = paginatedQueryOptions({
  queryKey: usersKeys.paginated,
  queryFn: fetchPaginatedUsers,
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});

export function userQueryOptions(userId: string) {
  return queryOptions({
    queryKey: usersKeys.byId(userId),
    queryFn: () => fetchUser(userId),
    staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
  });
}
```

### 4. Mutation Options (`{resource}.mutations.ts`)

```typescript
export function updateUserMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ id, data }: { id: string; data: UpdateData }) =>
      updateUser(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
    },
  };
}
```

### 5. Custom Hooks (`hooks/{resource}/`)

**Query Hook:**
```typescript
export function usePaginatedUsers() {
  return usePaginatedQuery({ ...paginatedUsersQueryOptions });
}
```

**Mutation Hook:**
```typescript
export function useUpdateUser() {
  const { t } = useTranslation("web");
  const queryClient = useQueryClient();

  return useMutation({
    ...updateUserMutationOptions(queryClient),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.paginated });
      toast.success(t("pages.users.actions.updateUserSuccess"));
    },
    onError: () => {
      toast.error(t("pages.users.actions.updateUserError"));
    },
  });
}
```

### Stale Time Config (`query-config.ts`)

```typescript
export const QUERY_STALE_TIMES = {
  AUTH: Infinity,
  PAGINATED_LIST: 5 * 60 * 1000,  // 5 minutes
  SINGLE_ITEM: 2 * 60 * 1000,     // 2 minutes
  RELATIONS: 3 * 60 * 1000,       // 3 minutes
  VALIDATION: 60 * 1000,          // 1 minute
  RUNTIME_CONFIG: 10 * 60 * 1000, // 10 minutes
} as const;
```

### Key Patterns

- **Queries**: Hooks return `useQuery` result, options defined separately
- **Mutations**: Hooks add toast notifications and i18n on top of base options
- **Cache invalidation**: Always invalidate related queries on mutation success
- **Error handling**: Mutations show toast errors via `onError`

## Common Commands

```bash
bun run dev          # Start all apps in dev mode
bun run build        # Build all apps
bun run lint         # Lint all apps
bun run check-types  # Type check
bun run format       # Format with Prettier

# Database
bun run drizzle:generate   # Generate migrations
bun run drizzle:migrate    # Run migrations
bun run drizzle:studio     # Open Drizzle Studio
```

## Commit Convention

Use **Conventional Commits** with scope matching the app/package:

```
action(scope): short message
```

### Actions
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring (no behavior change)
- `chore` - Maintenance, dependencies, config
- `docs` - Documentation only
- `style` - Formatting, whitespace (no code change)
- `test` - Adding/updating tests
- `perf` - Performance improvement

### Scopes
- `api` - apps/api changes
- `web` - apps/web changes
- `shared` - packages/shared changes
- `react` - packages/react changes
- `repo` - root-level/monorepo config changes

### Examples
```
feat(api): add user roles endpoint
fix(web): resolve pagination state reset
refactor(shared): simplify role permission logic
chore(repo): update bun.lock
feat(react): add MultiSelect component
```

---

## Task Completion Instructions

**IMPORTANT**: At the end of every task, generate commit messages for each affected app/package.

### Commit Message Generation Rules

1. **Analyze all changes** made during the task
2. **Group changes by scope** (api, web, shared, react, repo)
3. **Generate separate commit messages** for each scope with changes
4. **Format**: `action(scope): short descriptive message`

### Output Format

After completing a task, provide commit messages like:

```
## Suggested Commits

1. `feat(api): add endpoint for user preferences`
2. `feat(shared): add user preferences schema and queries`
3. `feat(web): add preferences settings page`
```

### Guidelines
- Keep messages under 72 characters
- Use imperative mood ("add" not "added")
- Be specific about what changed
- One commit per scope when changes are related
- Multiple commits per scope if changes are unrelated features/fixes
