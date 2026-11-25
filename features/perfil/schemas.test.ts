import { describe, expect, it } from "vitest";
import { updateAvatarSchema, updateProfileSchema } from "./schemas";

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

describe("updateAvatarSchema", () => {
  const file = (size: number) => new File([new Uint8Array(size)], "avatar.jpg", { type: "image/jpeg" });
  const message = (value: unknown) => {
    const result = updateAvatarSchema.safeParse({ avatar: value });
    return result.success ? null : result.error.issues[0].message;
  };

  it("aceita um arquivo de até 300 KB", () => {
    expect(message(file(300 * 1024))).toBeNull();
  });

  it("recusa arquivo maior que 300 KB", () => {
    expect(message(file(300 * 1024 + 1))).toBe("A imagem deve ter no máximo 300 KB.");
  });

  it("recusa arquivo vazio, texto ou campo ausente", () => {
    expect(message(file(0))).toBe("Escolha uma imagem.");
    expect(message("foto.jpg")).toBe("Escolha uma imagem.");
    expect(message(null)).toBe("Escolha uma imagem.");
  });
});
