import { describe, expect, it } from "vitest";
import { acceptConviteSchema } from "./schemas";

describe("acceptConviteSchema", () => {
  it("aceita o id de um torneio", () => {
    const torneioId = "5b0f8c9e-2f7e-4c55-9a4f-1b2c3d4e5f60";
    expect(acceptConviteSchema.parse({ torneioId })).toEqual({ torneioId });
  });

  it.each([
    ["que não é UUID", "nao-e-uuid"],
    ["vazio", ""],
    ["ausente", undefined],
  ])("recusa id %s", (_caso, torneioId) => {
    const result = acceptConviteSchema.safeParse({ torneioId });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0].message).toBe("ID do torneio inválido");
  });
});
