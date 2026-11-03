import type z from "zod";

export type SafeParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid response shape.";
}
