import type { FeatureFlagKey } from "~shared/feature-flags.registry";
import type { Organization, OrganizationDomain } from "~shared/types/db/organizations.types";
import type { User } from "~shared/types/db/users.types";

import { queryOptions } from "@tanstack/react-query";

import { adminApi, ApiError } from "@/lib/http";
import { QUERY_STALE_TIMES } from "~app-core/index";

export type OrgFlag = { key: FeatureFlagKey; description: string; enabled: boolean };

export type OrganizationDetail = {
  organization: Organization;
  domains: OrganizationDomain[];
  members: User[];
  memberCount: number;
  flags: OrgFlag[];
};

export const organizationsQueryOptions = queryOptions({
  queryKey: ["admin", "organizations"],
  queryFn: async (): Promise<Organization[]> => {
    const res = await adminApi.admin.organizations.$get();
    if (!res.ok) throw await ApiError.fromResponse(res);
    const body = await res.json();
    return body.organizations;
  },
  staleTime: QUERY_STALE_TIMES.PAGINATED_LIST,
});

export function organizationQueryOptions(orgId: string) {
  return queryOptions({
    queryKey: ["admin", "organizations", orgId],
    queryFn: async (): Promise<OrganizationDetail> => {
      const res = await adminApi.admin.organizations[":id{[a-zA-Z0-9_-]{21}}"].$get({ param: { id: orgId } });
      if (!res.ok) throw await ApiError.fromResponse(res);
      const body = await res.json();
      if (!body.success) throw new ApiError(404, "Not Found", "Not Found");
      return {
        organization: body.organization,
        domains: body.domains,
        members: body.members,
        memberCount: body.memberCount,
        flags: body.flags as OrgFlag[],
      };
    },
    staleTime: QUERY_STALE_TIMES.SINGLE_ITEM,
  });
}

export async function createOrganization(data: { name: string; slug: string }): Promise<Organization> {
  const res = await adminApi.admin.organizations.$post({ json: data });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new ApiError(res.status, "error" in body ? body.error : undefined, "error" in body ? body.error : "Request failed");
  }
  return body.organization;
}

export async function updateOrganization(orgId: string, data: { name?: string; slug?: string }): Promise<Organization> {
  const res = await adminApi.admin.organizations[":id{[a-zA-Z0-9_-]{21}}"].$put({ param: { id: orgId }, json: data });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new ApiError(res.status, "error" in body ? body.error : undefined, "error" in body ? body.error : "Request failed");
  }
  return body.organization;
}

export async function deleteOrganization(orgId: string): Promise<void> {
  const res = await adminApi.admin.organizations[":id{[a-zA-Z0-9_-]{21}}"].$delete({ param: { id: orgId } });
  if (!res.ok) throw await ApiError.fromResponse(res);
}
