import { describe, expect, it } from "vitest";
import { withTiedPositions } from "./ranking";

const positions = (points: number[]) =>
  withTiedPositions(points.map((p) => ({ points: p }))).map((r) => r.position);

describe("withTiedPositions", () => {
  it("lista vazia", () => {
    expect(positions([])).toEqual([]);
  });

  it("sem empate, posições seguidas", () => {
    expect(positions([30, 20, 10])).toEqual([1, 2, 3]);
  });

  it("empate divide a posição e pula as seguintes", () => {
    expect(positions([30, 20, 20, 10])).toEqual([1, 2, 2, 4]);
  });

  it("empate no topo", () => {
    expect(positions([15, 15, 15, 5])).toEqual([1, 1, 1, 4]);
  });

  it("mantém os demais campos", () => {
    expect(withTiedPositions([{ name: "Ana", points: 7 }])).toEqual([
      { name: "Ana", points: 7, position: 1 },
    ]);
  });
});
