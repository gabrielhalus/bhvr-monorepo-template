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
ALTER TABLE "cron_task_runs" ADD CONSTRAINT "cron_task_runs_task_id_cron_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."cron_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cron_task_runs_task_id" ON "cron_task_runs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_cron_task_runs_started_at" ON "cron_task_runs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_cron_task_runs_status" ON "cron_task_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cron_tasks_is_enabled" ON "cron_tasks" USING btree ("is_enabled");