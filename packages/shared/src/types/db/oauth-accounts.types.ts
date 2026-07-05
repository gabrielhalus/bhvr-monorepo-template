import type { OAuthAccountsModel } from "~shared/models/oauth-accounts.model";
import type { OAuthLinkTokensModel } from "~shared/models/oauth-link-tokens.model";
import type { OAUTH_PROVIDER_IDS } from "~shared/schemas/api/oauth.schemas";

export type OAuthAccount = typeof OAuthAccountsModel.$inferSelect;

export type OAuthLinkToken = typeof OAuthLinkTokensModel.$inferSelect;

export type OAuthProviderId = (typeof OAUTH_PROVIDER_IDS)[number];
