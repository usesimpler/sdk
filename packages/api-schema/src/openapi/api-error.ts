import z from "zod";
import "../patch-zod.js";

/** Error body shared by Site surface responses. */
export const apiErrorSchema = z.object({ error: z.string() });
