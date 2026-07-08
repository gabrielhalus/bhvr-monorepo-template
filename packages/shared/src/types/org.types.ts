/**
 * Branded organization id. Only two producers are legitimate: the API's
 * org-resolution middleware and `asOrgId` (scripts, bootstrap, tests).
 * Org-scoped queries take an `OrgId` as first parameter, so an unscoped
 * call site is a compile error rather than a data leak.
 */
export type OrgId = string & { readonly __brand: "OrgId" };

export function asOrgId(id: string): OrgId {
  return id as OrgId;
}
