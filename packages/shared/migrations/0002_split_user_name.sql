-- Add first_name and last_name columns
ALTER TABLE "users" ADD COLUMN "first_name" text;
ALTER TABLE "users" ADD COLUMN "last_name" text;
--> statement-breakpoint

-- Data migration: split existing name into first_name and last_name
UPDATE "users" SET
  "first_name" = SPLIT_PART("name", ' ', 1),
  "last_name" = TRIM(SUBSTRING("name" FROM POSITION(' ' IN "name") + 1));
--> statement-breakpoint

-- Handle cases where there's no space (last_name would be empty string)
UPDATE "users" SET "last_name" = '' WHERE "last_name" IS NULL OR "last_name" = '';
--> statement-breakpoint

-- Set NOT NULL constraints after populating data
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;
--> statement-breakpoint

-- Drop the old name column
ALTER TABLE "users" DROP COLUMN "name";
