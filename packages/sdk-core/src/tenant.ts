export type OrgTenantScope = {
  kind: "org";
  orgSlug?: string | null;
  orgId?: string | null;
};

export type TeamTenantScope = {
  kind: "team";
  teamId: string;
};

export type SiteTenantScope = {
  kind: "site";
};

export type TenantScope = OrgTenantScope | TeamTenantScope | SiteTenantScope;

export function orgTenant(scope: { orgSlug?: string | null; orgId?: string | null }): OrgTenantScope {
  return { kind: "org", orgSlug: scope.orgSlug ?? null, orgId: scope.orgId ?? null };
}

export function teamTenant(teamId: string): TeamTenantScope {
  return { kind: "team", teamId };
}

export function siteTenant(): SiteTenantScope {
  return { kind: "site" };
}
