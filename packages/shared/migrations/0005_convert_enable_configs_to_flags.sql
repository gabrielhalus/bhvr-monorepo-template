-- The boolean "enable" configs became feature flags (source of truth in
-- code: src/feature-flags.registry.ts, overrides in feature_flag_overrides).
-- Carry existing values over as platform-wide overrides, then drop the rows.
INSERT INTO "feature_flag_overrides" ("flag_key", "organization_id", "enabled", "updated_by")
SELECT
	CASE "config_key"
		WHEN 'authentication.register.enable' THEN 'registration'
		WHEN 'authentication.google.enable' THEN 'oauth-google'
		WHEN 'authentication.github.enable' THEN 'oauth-github'
		WHEN 'authentication.sso.enable' THEN 'sso'
	END,
	NULL,
	"value" = 'true',
	"updated_by"
FROM "configs"
WHERE "config_key" IN (
	'authentication.register.enable',
	'authentication.google.enable',
	'authentication.github.enable',
	'authentication.sso.enable'
)
ON CONFLICT DO NOTHING;--> statement-breakpoint
DELETE FROM "configs"
WHERE "config_key" IN (
	'authentication.register.enable',
	'authentication.google.enable',
	'authentication.github.enable',
	'authentication.sso.enable'
);