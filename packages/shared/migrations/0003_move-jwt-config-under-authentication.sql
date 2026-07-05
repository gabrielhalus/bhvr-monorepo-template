-- The JWT config moved from the "security" section to "authentication".
-- Rename the stored key so existing instances keep their signing secret
-- (bootstrap would otherwise purge the orphaned row and mint a new secret,
-- silently invalidating every active session).
UPDATE "configs"
SET "config_key" = 'authentication.jwt.secret'
WHERE "config_key" = 'security.jwt.secret'
  AND NOT EXISTS (
    SELECT 1 FROM "configs" WHERE "config_key" = 'authentication.jwt.secret'
  );
