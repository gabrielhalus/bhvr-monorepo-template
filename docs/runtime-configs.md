# Runtime Configs

Runtime configs allow you to change application behavior without redeploying. They are stored in the `runtime_configs` table and can be updated through the API or dashboard.

## Database Schema

| Column       | Type                                   | Description                                      |
| ------------ | -------------------------------------- | ------------------------------------------------ |
| config_key   | varchar(255) PK                        | Dot-notation key (e.g., `auth.feature`)          |
| value        | text                                   | Stored as string, parsed based on `type`         |
| type         | `string` \| `number` \| `boolean` \| `list` | Determines how value is parsed              |
| nullable     | boolean                                | Whether null values are allowed                  |
| options      | text                                   | JSON array of allowed values                     |
| disabled_when| text                                   | Condition to disable editing (UI only)           |
| order        | integer                                | Display order (editable only from database)      |
| updated_at   | timestamp                              | Last update timestamp                            |
| updated_by   | varchar(21)                            | User ID who made the last update                 |

## Config Key Naming Convention

Use dot notation to organize configs hierarchically:

```
category.configName
```

- **category**: Groups related configs (e.g., `authentication`, `features`)
- **configName**: Descriptive camelCase name

Example: `authentication.disableRegister`

## API Endpoints

### Public (No Auth Required)

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| GET    | `/api/config`    | Get all runtime configs   |
| GET    | `/api/config/:key` | Get config by key       |

### Protected (Auth Required)

| Method | Endpoint           | Permission               | Description      |
| ------ | ------------------ | ------------------------ | ---------------- |
| PUT    | `/api/config/:key` | `runtimeConfig:update`   | Update a config  |

## Seeding Configs

Create seed files in `packages/shared/seeds/`:

```typescript
// 001-runtime-configs.seed.ts
import type { SeedMeta } from "~shared/types/seeds.types";
import { RuntimeConfigModel } from "~shared/models/runtime-configs.model";

export const seed: SeedMeta = {
  id: "runtime-configs",
  version: 1,
  description: "Default runtime configuration values",
  data: [
    {
      configKey: "authentication.disableRegister",
      value: "true",
      type: "boolean",
      nullable: false,
    },
  ],
};

export default { seed, model: RuntimeConfigModel };
```

## Frontend Usage

```typescript
import { getRuntimeConfigsQueryOptions } from "~/queries/runtime-configs";

const { data } = useQuery(getRuntimeConfigsQueryOptions);
```
