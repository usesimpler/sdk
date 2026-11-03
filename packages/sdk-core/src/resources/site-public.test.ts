import { afterEach, describe, expect, it, vi } from "vitest";
import { createSimplerClient } from "../create-client.js";

describe("forSite", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the Site API key as Bearer and does not add team or org tenant", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "site-1", slug: "acme", title: "Acme", listing_scope: "all" }),
      url: "http://api.test/v1/site",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "session-token" },
    });
    await client.forSite("site_abc123secret").site.get();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/v1/site");
    expect(url).not.toContain("team_id=");
    expect(url).not.toContain("org_slug=");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer site_abc123secret");
    expect(headers["X-Team-Id"]).toBeUndefined();
  });

  it("loads a Page by slug", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "p1",
        slug: "home",
        title: "Home",
        sections: [],
      }),
      url: "http://api.test/v1/pages/home",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: null },
    });
    const page = await client.forSite("site_abc").pages.getBySlug("home");
    expect(page).toMatchObject({ slug: "home" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://api.test/v1/pages/home");
  });

  it("lists listings without a stage, sort, or page parameter", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0 }),
      url: "http://api.test/v1/listings",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "session-token" },
    });
    await client.forSite("site_abc123secret").listings.list();

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/v1/listings");
  });

  it("reads the public listing body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: "listing-1",
            street_address: "100 Listing St",
            list_price: 500_000,
            description: "Bright rooms",
            list_date: "2024-06-01T00:00:00.000Z",
            stage: { id: "stage-1", name: "Active" },
            list_agent: {
              first_name: "Ada",
              last_name: "Lovelace",
              phone: "416-555-0100",
              photo_url: "https://cdn.example/ada.jpg",
            },
          },
        ],
        total: 1,
      }),
      url: "http://api.test/v1/listings",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: null },
    });
    const listings = await client.forSite("site_abc").listings.list();

    expect(listings).toEqual([
      {
        id: "listing-1",
        street_address: "100 Listing St",
        list_price: 500_000,
        description: "Bright rooms",
        list_date: "2024-06-01T00:00:00.000Z",
        stage: { id: "stage-1", name: "Active" },
        list_agent: {
          first_name: "Ada",
          last_name: "Lovelace",
          phone: "416-555-0100",
          photo_url: "https://cdn.example/ada.jpg",
        },
      },
    ]);
  });
});
