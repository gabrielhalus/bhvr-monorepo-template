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
	"created_at" timestamp DEFAULT now() NOT NULL
);
