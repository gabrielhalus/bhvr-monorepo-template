CREATE TABLE "oauth_signup_tokens" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"provider" varchar(32) NOT NULL,
	"provider_account_id" text NOT NULL,
	"token" varchar(64) NOT NULL,
	"profile" json NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_signup_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE INDEX "idx_ost_provider_account" ON "oauth_signup_tokens" USING btree ("provider","provider_account_id");