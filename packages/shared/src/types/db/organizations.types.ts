import type { OrganizationDomainsModel } from "~shared/models/organization-domains.model";
import type { OrganizationMembersModel } from "~shared/models/organization-members.model";
import type { OrganizationsModel } from "~shared/models/organizations.model";

export type Organization = typeof OrganizationsModel.$inferSelect;

export type OrganizationDomain = typeof OrganizationDomainsModel.$inferSelect;

export type OrganizationMember = typeof OrganizationMembersModel.$inferSelect;
