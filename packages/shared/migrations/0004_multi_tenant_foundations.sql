CREATE TABLE "feature_flag_overrides" (
	"flag_key" varchar(64) NOT NULL,
	"organization_id" varchar(21),
	"enabled" boolean NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(21),
	CONSTRAINT "feature_flag_overrides_flag_org_unique" UNIQUE NULLS NOT DISTINCT("flag_key","organization_id")
);
--> statement-breakpoint
CREATE TABLE "org_configs" (
	"organization_id" varchar(21) NOT NULL,
	"config_key" varchar(255) NOT NULL,
	"value" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(21),
	CONSTRAINT "org_configs_organization_id_config_key_pk" PRIMARY KEY("organization_id","config_key")
);
--> statement-breakpoint
CREATE TABLE "organization_domains" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" varchar(21) NOT NULL,
	"domain" text NOT NULL,
	"type" varchar(12) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(64),
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"organization_id" varchar(21) NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"invited_by_id" varchar(21),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_organization_id_user_id_pk" PRIMARY KEY("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organization_translations" (
	"organization_id" varchar(21) NOT NULL,
	"locale" varchar(10) NOT NULL,
	"namespace" varchar(32) NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(21),
	CONSTRAINT "organization_translations_organization_id_locale_namespace_key_pk" PRIMARY KEY("organization_id","locale","namespace","key")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(63) NOT NULL,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
-- Single-tenant installs migrate into a deterministic default organization.
-- Fixed id so the backfill below is reproducible; bootstrap may rename it.
INSERT INTO "organizations" ("id", "name", "slug") VALUES ('org_default_000000000', 'Default', 'default');--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_name_unique";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_index_unique";--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "organization_id" varchar(21);--> statement-breakpoint
-- Added nullable (the generated NOT NULL would fail on existing rows), backfilled, then constrained below.
ALTER TABLE "invitations" ADD COLUMN "organization_id" varchar(21);--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "organization_id" varchar(21);--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "organization_id" varchar(21);--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "organization_id" varchar(21);--> statement-breakpoint
-- Backfill: all pre-multi-tenant data belongs to the default organization.
UPDATE "roles" SET "organization_id" = 'org_default_000000000';--> statement-breakpoint
UPDATE "user_roles" ur SET "organization_id" = r."organization_id" FROM "roles" r WHERE ur."role_id" = r."id";--> statement-breakpoint
UPDATE "invitations" SET "organization_id" = 'org_default_000000000';--> statement-breakpoint
UPDATE "logs" SET "organization_id" = 'org_default_000000000';--> statement-breakpoint
UPDATE "api_keys" SET "organization_id" = 'org_default_000000000';--> statement-breakpoint
INSERT INTO "organization_members" ("organization_id", "user_id")
SELECT 'org_default_000000000', "id" FROM "users";--> statement-breakpoint
-- Platform role (organization_id NULL): former super-admins keep platform-wide access.
INSERT INTO "roles" ("name", "index", "is_default", "is_super_admin", "organization_id")
VALUES ('platform-admin', 1000, false, true, NULL);--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role_id", "organization_id")
SELECT DISTINCT ur."user_id", (SELECT id FROM "roles" WHERE "name" = 'platform-admin' AND "organization_id" IS NULL), NULL
FROM "user_roles" ur
JOIN "roles" r ON r."id" = ur."role_id"
WHERE r."is_super_admin" AND r."organization_id" IS NOT NULL;--> statement-breakpoint
-- The authorization bypass becomes platform-only; org roles that relied on it
-- get the full permission list (as of this migration) so their access is unchanged.
INSERT INTO "role_permissions" ("role_id", "permission")
SELECT r."id", p."permission"
FROM "roles" r
CROSS JOIN (VALUES
	('backup:list'), ('backup:create'), ('backup:restore'),
	('apiKey:list'), ('apiKey:create'), ('apiKey:revoke'),
	('config:list'), ('config:update'),
	('cronTask:list'), ('cronTask:read'), ('cronTask:create'), ('cronTask:update'), ('cronTask:delete'), ('cronTask:trigger'),
	('invitation:create'), ('invitation:read'), ('invitation:list'), ('invitation:revoke'), ('invitation:delete'),
	('log:list'), ('log:delete'),
	('role:create'), ('role:read'), ('role:list'), ('role:update'), ('role:delete'),
	('session:list'), ('session:revoke'),
	('user:create'), ('user:read'), ('user:list'), ('user:update'), ('user:delete'), ('user:impersonate'),
	('userRole:create'), ('userRole:delete')
) AS p("permission")
WHERE r."is_super_admin" AND r."organization_id" IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
UPDATE "roles" SET "is_super_admin" = false WHERE "organization_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_configs" ADD CONSTRAINT "org_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "org_configs" ADD CONSTRAINT "org_configs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_domains" ADD CONSTRAINT "organization_domains_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_translations" ADD CONSTRAINT "organization_translations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_translations" ADD CONSTRAINT "organization_translations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_domains_primary_unique" ON "organization_domains" USING btree ("organization_id") WHERE "organization_domains"."is_primary";--> statement-breakpoint
CREATE INDEX "organization_members_user_id_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_id_org_unique" UNIQUE("id","organization_id");--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_org_fk" FOREIGN KEY ("role_id","organization_id") REFERENCES "public"."roles"("id","organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "logs_org_created_at_idx" ON "logs" USING btree ("organization_id","created_at");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_org_name_unique" UNIQUE NULLS NOT DISTINCT("organization_id","name");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_org_index_unique" UNIQUE NULLS NOT DISTINCT("organization_id","index");