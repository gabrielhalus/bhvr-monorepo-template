CREATE TABLE "audit_logs" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"action" varchar(100) NOT NULL,
	"actor_id" varchar(21) NOT NULL,
	"impersonator_id" varchar(21),
	"target_id" varchar(21),
	"target_type" varchar(50),
	"metadata" text,
	"ip" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cron_task_runs" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"task_id" varchar(21) NOT NULL,
	"status" varchar(10) NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"output" text,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "cron_tasks" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"cron_expression" varchar(100) NOT NULL,
	"handler" varchar(100) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation_roles" (
	"invitation_id" varchar(21) NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "invitation_roles_invitation_id_role_id_pk" PRIMARY KEY("invitation_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" varchar(64) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"invited_by_id" varchar(21) NOT NULL,
	"auto_validate_email" boolean DEFAULT false NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "notification_channels" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"type" varchar(16) NOT NULL,
	"name" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"effect" varchar(8) NOT NULL,
	"permission" text,
	"role_id" integer,
	"condition" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission" text NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_pk" PRIMARY KEY("role_id","permission")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"index" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name"),
	CONSTRAINT "roles_index_unique" UNIQUE("index")
);
--> statement-breakpoint
CREATE TABLE "runtime_configs" (
	"config_key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text,
	"type" varchar(16) NOT NULL,
	"nullable" boolean NOT NULL,
	"options" text,
	"disabled_when" text,
	"order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" varchar(21)
);
--> statement-breakpoint
CREATE TABLE "seeds" (
	"id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"checksum" text NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_agent" text,
	"ip" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" varchar(21) NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"avatar" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cron_task_runs" ADD CONSTRAINT "cron_task_runs_task_id_cron_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."cron_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation_roles" ADD CONSTRAINT "invitation_roles_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitation_roles" ADD CONSTRAINT "invitation_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "runtime_configs" ADD CONSTRAINT "runtime_configs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_cron_task_runs_task_id" ON "cron_task_runs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_cron_task_runs_started_at" ON "cron_task_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_cron_task_runs_status" ON "cron_task_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cron_tasks_is_enabled" ON "cron_tasks" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "idx_config_key_prefix" ON "runtime_configs" USING btree ("config_key");