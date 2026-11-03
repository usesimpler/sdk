import type {
  ListingMediaItem,
  PageNode,
  PageWithSections,
  PublicSite,
} from "@usesimpler/api-schema";
import { parseSiteListing, parseSiteListingsResponse } from "@usesimpler/api-schema/site-listing";
import type { createTransport } from "../transport.js";

type Transport = ReturnType<typeof createTransport>;

export function createSitePublicResource(transport: Transport) {
  return {
    async get(): Promise<PublicSite> {
      return transport.request<PublicSite>("/site");
    },
  };
}

export function createPublicPagesResource(transport: Transport) {
  return {
    async list(): Promise<PageNode[]> {
      return transport.request<PageNode[]>("/pages");
    },
    async getBySlug(slug: string): Promise<PageWithSections> {
      return transport.request<PageWithSections>(`/pages/${encodeURIComponent(slug)}`);
    },
  };
}

/** Site API key listings: narrow body, plus media. */
export function createSiteListingsResource(transport: Transport) {
  return {
    async list() {
      const raw = await transport.request<unknown>("/listings");
      return parseSiteListingsResponse(raw);
    },
    async get(id: string) {
      const raw = await transport.request<unknown>(`/listings/${encodeURIComponent(id)}`);
      return parseSiteListing(raw);
    },
    async listMedia(id: string): Promise<ListingMediaItem[]> {
      return transport.request<ListingMediaItem[]>(`/listings/${encodeURIComponent(id)}/media`);
    },
  };
}
