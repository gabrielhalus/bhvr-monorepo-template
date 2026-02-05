CREATE TABLE "invitation_roles" (
	"invitation_id" varchar(21) NOT NULL,
	"role_id" integer NOT NULL,
	CONSTRAINT "invitation_roles_invitation_id_role_id_pk" PRIMARY KEY("invitation_id","role_id")
);
--> statement-breakpoint
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_role_id_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "invitation_roles" ADD CONSTRAINT "invitation_roles_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitation_roles" ADD CONSTRAINT "invitation_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitations" DROP COLUMN "role_id";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "label";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "description";