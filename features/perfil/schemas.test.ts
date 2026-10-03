import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./schemas";

describe("updateProfileSchema", () => {
  it("aceita um nome válido e tira os espaços das pontas", () => {
    expect(updateProfileSchema.parse({ name: "  Ana Souza  " })).toEqual({ name: "Ana Souza" });
  });

  it.each([
    ["curto demais", "ab", "O nome deve ter pelo menos 3 caracteres."],
    ["só espaços", "     ", "O nome deve ter pelo menos 3 caracteres."],
    ["longo demais", "a".repeat(51), "O nome deve ter no máximo 50 caracteres."],
  ])("recusa nome %s", (_caso, name, mensagem) => {
    const result = updateProfileSchema.safeParse({ name });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].message).toBe(mensagem);
  });

  it("recusa quando o campo não vem", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });
});
