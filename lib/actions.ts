import { z } from "zod";
import { DomainError } from "@/lib/errors";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error?: string; fieldErrors?: FieldErrors };

export type ActionState = ActionResult | null;

export function toActionError(error: unknown): ActionResult {
  if (error instanceof DomainError) return { ok: false, error: error.message };
  throw error;
}

export function toFieldErrors(error: z.ZodError): ActionResult {
  return { ok: false, fieldErrors: z.flattenError(error).fieldErrors };
}
