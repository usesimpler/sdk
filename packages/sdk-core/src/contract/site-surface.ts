export type SiteSurfaceClient = {
  forSite(siteApiKey: string): {
    site: { get(): Promise<unknown> };
    pages: { list(): Promise<unknown>; getBySlug(slug: string): Promise<unknown> };
    listings: {
      list(): Promise<readonly ListingBody[]>;
      get(id: string): Promise<ListingBody>;
      listMedia(id: string): Promise<unknown>;
    };
  };
};

type ListingBody = {
  id: string;
  list_agent?: object;
  co_list_agent?: object;
};

type PageNodeLike = {
  slug: string;
  children?: readonly PageNodeLike[];
};

export type SiteSurfaceContractOptions = {
  apiBase: string;
  siteApiKey: string;
  createClient: (config: {
    apiBase: string;
    auth: { type: "oauth"; accessToken: string };
  }) => SiteSurfaceClient;
  schemas: {
    parsePublicSite: (value: unknown) => { id: string; slug: string };
    parsePageTree: (value: unknown) => readonly PageNodeLike[];
    parsePage: (value: unknown) => { slug: string; sections: readonly unknown[] };
    parseMediaList: (value: unknown) => readonly unknown[];
  };
};

export class SiteSurfaceContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SiteSurfaceContractError";
  }
}

function firstPageSlug(pages: readonly PageNodeLike[]): string | null {
  for (const page of pages) {
    if (page.slug) return page.slug;
    const child = firstPageSlug(page.children ?? []);
    if (child) return child;
  }
  return null;
}

function assertNoSeller(listing: ListingBody): void {
  if ("seller" in listing || "seller_contact_id" in listing) {
    throw new SiteSurfaceContractError("Site listing includes the seller.");
  }
  for (const agent of [listing.list_agent, listing.co_list_agent]) {
    if (agent && "email" in agent) {
      throw new SiteSurfaceContractError("Site listing agent includes an email.");
    }
  }
}

/**
 * Calls the Site surface through a Simpler API client and checks the responses
 * against that client's integrator schemas. A breaking response fails the run.
 */
export async function runSiteSurfaceContract(options: SiteSurfaceContractOptions): Promise<void> {
  const site = options
    .createClient({
      apiBase: options.apiBase,
      auth: { type: "oauth", accessToken: "unused" },
    })
    .forSite(options.siteApiKey);

  const branding = options.schemas.parsePublicSite(await site.site.get());
  if (!branding.id || !branding.slug) {
    throw new SiteSurfaceContractError("Site branding is missing an id or slug.");
  }

  const pages = options.schemas.parsePageTree(await site.pages.list());
  const slug = firstPageSlug(pages);
  if (!slug) throw new SiteSurfaceContractError("Site surface returned no pages.");

  const page = options.schemas.parsePage(await site.pages.getBySlug(slug));
  if (!Array.isArray(page.sections)) {
    throw new SiteSurfaceContractError("Page is missing its sections.");
  }

  const listings = await site.listings.list();
  if (listings.length === 0) {
    throw new SiteSurfaceContractError("Site surface returned no listings.");
  }
  const listed = listings[0];
  if (!listed?.id) throw new SiteSurfaceContractError("Listing is missing an id.");
  assertNoSeller(listed);

  const fetched = await site.listings.get(listed.id);
  if (fetched.id !== listed.id) {
    throw new SiteSurfaceContractError("Listing get returned a different id.");
  }
  assertNoSeller(fetched);

  const media = options.schemas.parseMediaList(await site.listings.listMedia(listed.id));
  if (media.length === 0) {
    throw new SiteSurfaceContractError("Site surface returned no listing media.");
  }
}
