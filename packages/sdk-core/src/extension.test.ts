import { afterEach, describe, expect, it, vi } from "vitest";
import { createSimplerClient, SimplerApiError, type SimplerTransport } from "./index.js";

/** A resource defined outside the client, using only the public transport. */
function createWidgetsResource(transport: SimplerTransport) {
  return {
    get(id: string) {
      return transport.request<{ id: string }>(`/widgets/${encodeURIComponent(id)}`);
    },
  };
}

describe("fork extension", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the team tenant header and bearer token for an outside resource", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "w1" }),
      url: "http://api.test/v1/widgets/w1",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "tok_team" },
    });
    const widget = await client
      .forTeam("team-1")
      .withResources((transport) => ({ widgets: createWidgetsResource(transport) }))
      .widgets.get("w1");

    expect(widget).toEqual({ id: "w1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/v1/widgets/w1?team_id=team-1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer tok_team",
          "X-Team-Id": "team-1",
        }),
      }),
    );
  });

  it("sends the org tenant header for an outside resource", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "w1" }),
      url: "http://api.test/v1/widgets/w1",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "tok_org" },
    });
    await client
      .forOrg({ orgSlug: "acme" })
      .withResources((transport) => ({ widgets: createWidgetsResource(transport) }))
      .widgets.get("w1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/v1/widgets/w1?org_slug=acme",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer tok_org",
          "X-Org-Slug": "acme",
        }),
      }),
    );
  });

  it("throws SimplerApiError when the outside resource gets an error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ error: "Widget missing" }),
      }),
    );

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "tok" },
    });
    const widgets = client
      .forTeam("team-1")
      .withResources((transport) => ({ widgets: createWidgetsResource(transport) })).widgets;

    await expect(widgets.get("missing")).rejects.toBeInstanceOf(SimplerApiError);
    await expect(widgets.get("missing")).rejects.toMatchObject({
      status: 404,
      message: "Widget missing",
    });
  });

  it("uses the client timeout for an outside resource", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(
          new DOMException("The operation was aborted due to timeout", "TimeoutError"),
        ),
    );

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "tok" },
      timeoutMs: 2500,
    });
    const widgets = client
      .forOrg({ orgId: "org-1" })
      .withResources((transport) => ({ widgets: createWidgetsResource(transport) })).widgets;

    await expect(widgets.get("w1")).rejects.toBeInstanceOf(SimplerApiError);
    await expect(widgets.get("w1")).rejects.toMatchObject({
      status: 408,
      message: "Request timed out after 2500ms",
    });
  });

  it("keeps the original fork unchanged when resources are added", () => {
    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "tok" },
    });
    const team = client.forTeam("team-1");
    const withWidgets = team.withResources((transport) => ({
      widgets: createWidgetsResource(transport),
    }));
    const withBoth = withWidgets.withResources(() => ({
      gadgets: { list: () => Promise.resolve(["g1"]) },
    }));

    expect(team).not.toHaveProperty("widgets");
    expect(team).not.toHaveProperty("listings");
    expect(withWidgets).not.toHaveProperty("gadgets");
    expect(withBoth.widgets).toBe(withWidgets.widgets);
    expect(typeof withBoth.gadgets.list).toBe("function");
    expect(withBoth.request).toBe(team.request);
  });

  it("inherits the session auth strategy instead of copying a token", async () => {
    let token = "first";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "w1" }),
      url: "http://api.test/v1/widgets/w1",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "session", getAccessToken: async () => token, credentials: "include" },
    });
    const widgets = client
      .forTeam("team-1")
      .withResources((transport) => ({ widgets: createWidgetsResource(transport) })).widgets;
    token = "second";

    await widgets.get("w1");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/v1/widgets/w1?team_id=team-1",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          Authorization: "Bearer second",
        }),
      }),
    );
  });

  it("does not let forSite inherit a session or OAuth token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "site-1" }),
      url: "http://api.test/v1/site",
    });
    vi.stubGlobal("fetch", fetchMock);

    const sessionClient = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "session", getAccessToken: async () => "sess-token", credentials: "include" },
    });
    await sessionClient.forSite("site_key").site.get();

    const oauthClient = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "oauth-token" },
    });
    await oauthClient.forSite("site_key").site.get();

    for (const call of fetchMock.mock.calls) {
      const [url, init] = call as [string, RequestInit];
      expect(url).toBe("http://api.test/v1/site");
      const headers = init.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer site_key");
      expect(init.credentials).toBeUndefined();
      expect(headers["X-Team-Id"]).toBeUndefined();
      expect(headers["X-Org-Slug"]).toBeUndefined();
    }
  });
});
