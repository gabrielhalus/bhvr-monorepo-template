# Policies

Policies provide fine-grained access control beyond simple role-based permissions. They allow conditional authorization based on user attributes, resource attributes, and literals.

## Database Schema

| Column      | Type          | Description                          |
| ----------- | ------------- | ------------------------------------ |
| id          | serial PK     | Auto-incrementing ID                 |
| effect      | `allow` \| `deny` | Whether to grant or deny access  |
| permission  | text          | Permission this policy applies to    |
| role_id     | integer FK    | Role this policy belongs to          |
| condition   | text          | JSON-encoded condition object        |
| description | text          | Human-readable description           |

## Available Permissions

| Resource       | Permissions                                         |
| -------------- | --------------------------------------------------- |
| user           | `user:create`, `user:read`, `user:list`, `user:update`, `user:delete` |
| role           | `role:create`, `role:read`, `role:list`, `role:update`, `role:delete` |
| userRole       | `userRole:create`, `userRole:delete`                |
| runtimeConfig  | `runtimeConfig:list`, `runtimeConfig:update`        |
| invitation     | `invitation:create`, `invitation:list`, `invitation:revoke`, `invitation:delete` |

## Condition Syntax

Conditions use a JSON structure with logical and comparison operators.

### Operand Types

| Type            | Description                        | Example                                  |
| --------------- | ---------------------------------- | ---------------------------------------- |
| `user_attr`     | Access user properties             | `{ "type": "user_attr", "key": "id" }`   |
| `resource_attr` | Access resource properties         | `{ "type": "resource_attr", "key": "ownerId" }` |
| `literal`       | Static value                       | `{ "type": "literal", "value": "admin" }` |

### Operators

| Operator    | Description                | Example                                |
| ----------- | -------------------------- | -------------------------------------- |
| `and`       | All conditions must match  | `{ "op": "and", "conditions": [...] }` |
| `or`        | Any condition must match   | `{ "op": "or", "conditions": [...] }`  |
| `not`       | Negates a condition        | `{ "op": "not", "condition": {...} }`  |
| `eq`        | Equal                      | `{ "op": "eq", "left": ..., "right": ... }` |
| `neq`       | Not equal                  | `{ "op": "neq", "left": ..., "right": ... }` |
| `lt`        | Less than                  | `{ "op": "lt", "left": ..., "right": ... }` |
| `lte`       | Less than or equal         | `{ "op": "lte", "left": ..., "right": ... }` |
| `gt`        | Greater than               | `{ "op": "gt", "left": ..., "right": ... }` |
| `gte`       | Greater than or equal      | `{ "op": "gte", "left": ..., "right": ... }` |
| `in`        | Value in array             | `{ "op": "in", "left": ..., "right": [...] }` |
| `not_in`    | Value not in array         | `{ "op": "not_in", "left": ..., "right": [...] }` |
| `exists`    | Operand exists             | `{ "op": "exists", "operand": ... }` |
| `not_exists`| Operand does not exist     | `{ "op": "not_exists", "operand": ... }` |

## Example Policies

### Allow users to update their own profile

```json
{
  "effect": "allow",
  "permission": "user:update",
  "condition": {
    "op": "eq",
    "left": { "type": "user_attr", "key": "id" },
    "right": { "type": "resource_attr", "key": "id" }
  }
}
```

### Deny access to sensitive config keys

```json
{
  "effect": "deny",
  "permission": "runtimeConfig:update",
  "condition": {
    "op": "in",
    "left": { "type": "resource_attr", "key": "key" },
    "right": [
      { "type": "literal", "value": "security.apiKey" },
      { "type": "literal", "value": "database.password" }
    ]
  }
}
```

### Allow update only if user is the last updater

```json
{
  "effect": "allow",
  "permission": "runtimeConfig:update",
  "condition": {
    "op": "eq",
    "left": { "type": "user_attr", "key": "id" },
    "right": { "type": "resource_attr", "key": "updatedBy" }
  }
}
```

## Authorization Flow

1. Check if user has any roles (deny if none)
2. Check if user has a super-admin role (allow if yes)
3. For each role, evaluate policies in order:
   - If condition matches and effect is `allow` -> grant access
   - If condition matches and effect is `deny` -> deny immediately
4. Fall back to checking simple permissions
5. Deny if no rule matched

## Using in API Routes

```typescript
import { requirePermissionFactory } from "~/middlewares/access-control";

app.put(
  "/api/resource/:id",
  requirePermissionFactory("resource:update", c => ({
    id: c.req.param("id"),
    ownerId: c.get("resource").ownerId,
  })),
  handler
);
```

The second argument is a function that returns the resource context for condition evaluation.
