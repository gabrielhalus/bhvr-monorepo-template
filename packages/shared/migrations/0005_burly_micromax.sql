CREATE TABLE "saml_flows" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"request_id" varchar(128) NOT NULL,
	"mode" varchar(16) NOT NULL,
	"redirect_to" text NOT NULL,
	"link_token" varchar(64),
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saml_flows_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE INDEX "idx_saml_flows_expires_at" ON "saml_flows" USING btree ("expires_at");