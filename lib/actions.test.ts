import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toActionError, toFieldErrors } from "@/lib/actions";
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  RuleViolationError,
} from "@/lib/errors";

describe("erros de domínio", () => {
  it.each([
    [NotFoundError, "NotFoundError"],
    [ForbiddenError, "ForbiddenError"],
    [ConflictError, "ConflictError"],
    [RuleViolationError, "RuleViolationError"],
  ])("%s é um DomainError com o nome da classe", (ErrorClass, name) => {
    const error = new ErrorClass("mensagem");
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe(name);
    expect(error.message).toBe("mensagem");
  });
});

describe("toActionError", () => {
  it("transforma um erro de domínio em mensagem", () => {
    expect(toActionError(new ForbiddenError("Somente o criador pode editar"))).toEqual({
      ok: false,
      error: "Somente o criador pode editar",
    });
  });

  it("lança de novo qualquer outro erro", () => {
    const inesperado = new Error("falha no banco");
    expect(() => toActionError(inesperado)).toThrow(inesperado);
    expect(() => toActionError("texto")).toThrow();
  });
});

describe("toFieldErrors", () => {
  it("devolve os erros de cada campo", () => {
    const schema = z.object({ nome: z.string().min(3, "Nome curto demais"), data: z.string() });
    const parsed = schema.safeParse({ nome: "ab" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const result = toFieldErrors(parsed.error);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors?.nome).toEqual(["Nome curto demais"]);
    expect(result.fieldErrors?.data).toHaveLength(1);
  });
});
