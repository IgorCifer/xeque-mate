import { describe, expect, it } from "vitest";
import { avatarUrl, detectImageType } from "./avatar";

const bytes = (...values: number[]) => new Uint8Array(values);

describe("detectImageType", () => {
  it("reconhece JPEG, PNG e WebP pelos primeiros bytes", () => {
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0x00))).toBe("image/jpeg");
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00))).toBe("image/png");
    expect(
      detectImageType(bytes(0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50)),
    ).toBe("image/webp");
  });

  it("recusa outros formatos, mesmo com nome de imagem", () => {
    expect(detectImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(detectImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBeNull();
    expect(detectImageType(bytes(0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45))).toBeNull();
  });

  it("recusa arquivo vazio ou cortado", () => {
    expect(detectImageType(bytes())).toBeNull();
    expect(detectImageType(bytes(0xff, 0xd8))).toBeNull();
  });
});

describe("avatarUrl", () => {
  it("muda a versão quando a foto muda", () => {
    expect(avatarUrl("abc", new Date(1000))).toBe("/api/avatar/abc?v=1000");
    expect(avatarUrl("abc", new Date(2000))).not.toBe(avatarUrl("abc", new Date(1000)));
  });
});
