import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { describe, expect, it } from "vitest";
import { registerListingsIntegratorPaths } from "./openapi.js";
import { safeParseListingMediaList, safeParseSiteListing } from "./validate.js";

describe("integrator listing response validation", () => {
  it("accepts listing media array", () => {
    const r = safeParseListingMediaList([
      {
        id: "m1",
        url: "https://example.com/a.webp",
        thumb_url: "https://example.com/t.webp",
        card_url: "https://example.com/c.webp",
        filename: "a.webp",
        content_type: "image/webp",
        sort_order: 0,
        is_cover: true,
      },
    ]);
    expect(r.ok).toBe(true);
  });

  it("accepts a public site listing and rejects seller, org, and agent email", () => {
    const r = safeParseSiteListing({
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
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.stage).toMatchObject({ name: "Active" });
    expect(r.data.list_agent).not.toHaveProperty("email");

    const withSeller = safeParseSiteListing({
      id: "listing-1",
      org_id: "o1",
      seller: { id: "c1" },
      seller_contact_id: "c1",
      meta_campaign_id: "camp-1",
      accepted_offer: { id: "offer-1" },
      team_id: "t1",
    });
    expect(withSeller.ok).toBe(false);
  });
});

describe("listing OpenAPI", () => {
  it("describes the Site API key listing body without the full platform listing", () => {
    const registry = new OpenAPIRegistry();
    registerListingsIntegratorPaths(registry);
    const doc = new OpenApiGeneratorV31(registry.definitions).generateDocument({
      openapi: "3.1.0",
      info: { title: "test", version: "0" },
    });
    const siteListing = doc.components?.schemas?.SiteListing as {
      properties: Record<string, unknown>;
    };
    expect(siteListing.properties).toMatchObject({
      street_address: expect.anything(),
      list_price: expect.anything(),
      description: expect.anything(),
      list_date: expect.anything(),
      expiry_date: expect.anything(),
      stage: expect.anything(),
      derived_stage: expect.anything(),
      linked_contacts: expect.anything(),
      linked_deals: expect.anything(),
      linked_instagram_media: expect.anything(),
      list_agent: expect.anything(),
      co_list_agent: expect.anything(),
    });
    for (const omitted of [
      "org_id",
      "team_id",
      "seller",
      "seller_contact_id",
      "meta_campaign_id",
      "accepted_offer",
      "list_agent_id",
      "co_list_agent_id",
    ]) {
      expect(siteListing.properties).not.toHaveProperty(omitted);
    }
    const agent = doc.components?.schemas?.SiteListingAgent as {
      properties: Record<string, unknown>;
    };
    expect(agent.properties).toMatchObject({
      first_name: expect.anything(),
      last_name: expect.anything(),
      phone: expect.anything(),
      photo_url: expect.anything(),
    });
    expect(agent.properties).not.toHaveProperty("email");
    expect(agent.properties).not.toHaveProperty("id");
    expect(siteListing).toMatchObject({ additionalProperties: false });
    expect(agent).toMatchObject({ additionalProperties: false });

    const listSchema = doc.paths?.["/v1/listings"]?.get?.responses?.["200"]?.content?.[
      "application/json"
    ]?.schema as { $ref?: string } | undefined;
    const oneSchema = doc.paths?.["/v1/listings/{id}"]?.get?.responses?.["200"]?.content?.[
      "application/json"
    ]?.schema as { $ref?: string } | undefined;
    expect(listSchema).toMatchObject({ $ref: "#/components/schemas/SiteListListingsResponse" });
    expect(oneSchema).toMatchObject({ $ref: "#/components/schemas/SiteListing" });
    expect(JSON.stringify(doc.paths?.["/v1/listings/{id}/media"]?.get)).toContain(
      "ListingMediaItem",
    );
    expect(JSON.stringify(listSchema)).not.toContain("ListingsRead");
    expect(JSON.stringify(oneSchema)).not.toContain("ListingRead");
    expect(doc.components?.schemas).not.toHaveProperty("Listing");
    expect(doc.paths?.["/v1/listings"]?.post).toBeUndefined();
  });
});
