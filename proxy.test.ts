import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config, proxy } from "./proxy";

describe("proxy", () => {
  it.each([
    ["/torneios/abc/convite", true],
    ["/profile", true],
    ["/", true],
    ["/api/auth/get-session", false],
    ["/_next/static/chunks/app.js", false],
    ["/xequeLogo.jpg", false],
  ])("roda em %s: %s", (url, expected) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(expected);
  });

  it("repassa o caminho e os parâmetros da página, por cima do que o navegador mandar", () => {
    const request = new NextRequest("http://localhost:3000/torneios/abc/convite?ref=1", {
      headers: { "x-next-path": "https://exemplo.com" },
    });

    const response = proxy(request);

    expect(response.headers.get("x-middleware-request-x-next-path")).toBe(
      "/torneios/abc/convite?ref=1",
    );
  });
});
