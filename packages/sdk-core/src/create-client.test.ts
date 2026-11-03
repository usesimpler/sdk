import { afterEach, describe, expect, it, vi } from "vitest";
import { createSimplerClient } from "./create-client.js";

describe("createSimplerClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("root request has no tenant query or headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "u1" }),
      url: "http://api.test/v1/me",
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = createSimplerClient({
      apiBase: "http://api.test",
      auth: { type: "session", getAccessToken: async () => "sess", credentials: "include" },
    });

    await client.request("/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/v1/me",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          Authorization: "Bearer sess",
        }),
      }),
    );
    const headers = (fetchMock.mock.calls[0]?.[1]?.headers ?? {}) as Record<string, string>;
    expect(headers["X-Team-Id"]).toBeUndefined();
    expect(headers["X-Org-Slug"]).toBeUndefined();
  });
});
