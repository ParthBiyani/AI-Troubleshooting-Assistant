import { describe, expect, it } from "vitest";
import { reciprocalRankFusion } from "@/lib/retrieval/fuse";

describe("reciprocal rank fusion", () => {
  it("scores a document by the sum of 1/(k+rank) over rankings", () => {
    const s = reciprocalRankFusion(
      [
        ["a", "b"],
        ["b", "a"],
      ],
      60,
    );
    expect(s.get("a")).toBeCloseTo(1 / 61 + 1 / 62);
    expect(s.get("a")).toBeCloseTo(s.get("b")!);
  });

  it("ranks documents found by both rankers above documents found by one", () => {
    const s = reciprocalRankFusion([
      ["a", "b", "c"],
      ["c", "d"],
    ]);
    const order = [...s.entries()].sort((x, y) => y[1] - x[1]).map(([id]) => id);
    expect(order[0]).toBe("c");
  });

  it("handles an empty ranking", () => {
    expect(reciprocalRankFusion([[], ["a"]]).get("a")).toBeCloseTo(1 / 61);
  });
});
