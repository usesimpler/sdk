import type { SimplerAuth } from "./auth.js";
import {
  createPublicPagesResource,
  createSiteListingsResource,
  createSitePublicResource,
} from "./resources/site-public.js";
import {
  type OrgTenantScope,
  orgTenant,
  siteTenant,
  type TeamTenantScope,
  teamTenant,
} from "./tenant.js";
import {
  createTransport,
  DEFAULT_TIMEOUT_MS,
  type RequestOptions,
  type SimplerTransport,
  type TransportConfig,
} from "./transport.js";

export type SimplerClientConfig = {
  apiBase: string;
  auth: SimplerAuth;
  timeoutMs?: number;
};

/** Team integration surface. Launches with no resources. */
export interface ScopedSimplerClient {
  /** Low-level `/v1` request for a resource added on a fork. */
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  /**
   * Return a new fork with extra resources. The receiver is unchanged.
   * Resources receive this fork's transport, so they inherit its auth, tenant, and timeout.
   */
  withResources<TResources extends object>(
    define: (transport: SimplerTransport) => TResources,
  ): this & TResources;
}

function scopedClient(
  config: TransportConfig,
  tenant: OrgTenantScope | TeamTenantScope,
): ScopedSimplerClient {
  const transport = createTransport(config, tenant);
  return {
    request: transport.request,
    withResources(define) {
      return { ...this, ...define({ request: this.request }) };
    },
  };
}

export function createSimplerClient(config: SimplerClientConfig) {
  const transportConfig: TransportConfig = {
    apiBase: config.apiBase,
    auth: config.auth,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
  const rootTransport = createTransport(transportConfig);

  return {
    /** Authenticated routes without org/team scope (e.g. `GET /me`). */
    request<T>(path: string, options?: RequestOptions): Promise<T> {
      return rootTransport.request(path, options);
    },

    forOrg(scope: { orgSlug?: string | null; orgId?: string | null }): ScopedSimplerClient {
      return scopedClient(transportConfig, orgTenant(scope));
    },

    forTeam(teamId: string): ScopedSimplerClient {
      return scopedClient(transportConfig, teamTenant(teamId));
    },

    /**
     * Read-only Site-scoped client. Auth is the Site API key only —
     * it does not inherit the root client's session or OAuth token.
     */
    forSite(siteApiKey: string): SiteScopedSimplerClient {
      const siteTransport = createTransport(
        { ...transportConfig, auth: { type: "oauth", accessToken: siteApiKey } },
        siteTenant(),
      );
      return {
        site: createSitePublicResource(siteTransport),
        pages: createPublicPagesResource(siteTransport),
        listings: createSiteListingsResource(siteTransport),
        withResources(define) {
          return { ...this, ...define({ request: siteTransport.request }) };
        },
      };
    },
  };
}

export interface SiteScopedSimplerClient {
  readonly site: ReturnType<typeof createSitePublicResource>;
  readonly pages: ReturnType<typeof createPublicPagesResource>;
  readonly listings: ReturnType<typeof createSiteListingsResource>;
  /**
   * Return a new fork with extra resources. The receiver is unchanged.
   * Resources receive this fork's Site API key transport.
   */
  withResources<TResources extends object>(
    define: (transport: SimplerTransport) => TResources,
  ): this & TResources;
}

export type SimplerClient = ReturnType<typeof createSimplerClient>;
