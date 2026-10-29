import { describe, expect, it } from "vitest";
import { authPagePath, safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it.each([
    ["/torneios/abc/convite", "/torneios/abc/convite"],
    ["/profile?aba=ranking", "/profile?aba=ranking"],
    ["/", "/"],
  ])("aceita o caminho interno %s", (value, expected) => {
    expect(safeNextPath(value)).toBe(expected);
  });

  it.each([
    ["outro site", "https://exemplo.com/roubo"],
    ["caminho com duas barras", "//exemplo.com"],
    ["barra invertida", "/\\exemplo.com"],
    ["tab entre as barras", "/\t/exemplo.com"],
    ["esquema javascript", "javascript:alert(1)"],
    ["relativo", "torneios"],
    ["vazio", ""],
    ["a própria tela de login", "/login?next=/profile"],
    ["a tela de cadastro", "/registrar"],
  ])("recusa %s", (_caso, value) => {
    expect(safeNextPath(value)).toBeNull();
  });

  it("recusa o que não é texto", () => {
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(["/profile"])).toBeNull();
  });
});

describe("authPagePath", () => {
  it("leva a origem no parâmetro next", () => {
    expect(authPagePath("/login", "/torneios/abc/convite")).toBe(
      "/login?next=%2Ftorneios%2Fabc%2Fconvite",
    );
    expect(authPagePath("/registrar", "/profile")).toBe("/registrar?next=%2Fprofile");
  });

  it("sem origem válida, vai para a página sem parâmetro", () => {
    expect(authPagePath("/login", null)).toBe("/login");
    expect(authPagePath("/login", "https://exemplo.com")).toBe("/login");
  });
});
