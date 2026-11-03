import { afterEach, describe, expect, it, vi } from "vitest";
import { SimplerApiError } from "./errors.js";
import { createTransport } from "./transport.js";
import { orgTenant, teamTenant } from "./tenant.js";

describe("createTransport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies org_slug tenant to public listing list URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
      url: "http://api.test/v1/listings?org_slug=acme",
    });
    vi.stubGlobal("fetch", fetchMock);

    const { request } = createTransport(
      { apiBase: "http://api.test", auth: { type: "oauth", accessToken: null } },
      orgTenant({ orgSlug: "acme" }),
    );

    await request("/listings");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/v1/listings?org_slug=acme",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Org-Slug": "acme",
        }),
      }),
    );
  });

  it("applies team_id and bearer for platform requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0 }),
      url: "http://api.test/v1/listings?team_id=t1",
    });
    vi.stubGlobal("fetch", fetchMock);

    const { request } = createTransport(
      {
        apiBase: "http://api.test",
        auth: { type: "oauth", accessToken: "tok_abc" },
      },
      teamTenant("t1"),
    );

    await request("/listings");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/v1/listings?team_id=t1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer tok_abc",
          "X-Team-Id": "t1",
        }),
      }),
    );
  });

  it("returns blob bodies when response is blob", async () => {
    const blob = new Blob(["a,b\n1,2"], { type: "text/csv" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => blob,
        url: "http://api.test/v1/contacts/export?team_id=t1",
      }),
    );

    const { request } = createTransport(
      { apiBase: "http://api.test", auth: { type: "oauth", accessToken: "tok" } },
      teamTenant("t1"),
    );

    const result = await request<Blob>("/contacts/export", { response: "blob" });
    expect(result).toBe(blob);
  });

  it("throws SimplerApiError on error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({ error: "Missing permission" }),
      }),
    );

    const { request } = createTransport({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "tok" },
    });

    await expect(request("/listings")).rejects.toBeInstanceOf(SimplerApiError);
    await expect(request("/listings")).rejects.toMatchObject({
      status: 403,
      message: "Missing permission",
    });
  });

  it("maps undici TimeoutError to SimplerApiError 408", async () => {
    const timeoutErr = new DOMException(
      "The operation was aborted due to timeout",
      "TimeoutError",
    );
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutErr));

    const { request } = createTransport({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "tok" },
      timeoutMs: 1_000,
    });

    await expect(request("/listings")).rejects.toBeInstanceOf(SimplerApiError);
    await expect(request("/listings")).rejects.toMatchObject({
      status: 408,
      message: "Request timed out after 1000ms",
    });
  });

  it("rethrows non-timeout fetch failures unchanged", async () => {
    const networkErr = new TypeError("fetch failed");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkErr));

    const { request } = createTransport({
      apiBase: "http://api.test",
      auth: { type: "oauth", accessToken: "tok" },
    });

    await expect(request("/listings")).rejects.toBe(networkErr);
  });
});
