import "../patch-zod.js";
import z from "zod";

const pageIdentityFields = {
  id: z.string(),
  site_id: z.string(),
  parent_id: z.string().nullable(),
  title: z.string(),
  slug: z.string(),
  seo_title: z.string().nullable(),
  seo_description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
};

type PageIdentity = {
  id: string;
  site_id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type PageNode = PageIdentity & {
  children: PageNode[];
};

export const publicSiteSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    site_name: z.string().nullable(),
    logo_url: z.string().nullable(),
    logo_content_type: z.string().nullable(),
    logo_display_width: z.number().nullable(),
    logo_display_height: z.number().nullable(),
    listing_id: z.string().nullable(),
    listing_scope: z.enum(["all", "listing"]),
  })
  .openapi("PublicSite");

export const pageSectionSchema = z
  .object({
    id: z.string(),
    page_id: z.string(),
    title: z.string().nullable(),
    body: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi("PageSection");

export const pageNodeSchema: z.ZodType<PageNode> = z
  .object({
    ...pageIdentityFields,
    children: z.array(z.lazy(() => pageNodeSchema)),
  })
  .openapi("PageNode");

export const pageWithSectionsSchema = z
  .object({
    ...pageIdentityFields,
    sections: z.array(pageSectionSchema),
  })
  .openapi("PageWithSections");

export const pageTreeSchema = z.array(pageNodeSchema).openapi("PageTree");

export type PublicSite = z.infer<typeof publicSiteSchema>;
export type PageSection = z.infer<typeof pageSectionSchema>;
export type PageWithSections = PageIdentity & {
  sections: PageSection[];
};
