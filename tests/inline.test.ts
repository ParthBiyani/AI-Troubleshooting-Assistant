import { describe, expect, it } from "vitest";
import { meaningfulTerms, stripLevelTag } from "@/lib/ui-text";

describe("stripLevelTag", () => {
  it("removes a level tag the model repeated inside the step text", () => {
    expect(stripLevelTag("(L1) Get the order_id")).toBe("Get the order_id");
    expect(stripLevelTag("  (L2) Check the logs")).toBe("Check the logs");
  });

  it("leaves other text alone", () => {
    expect(stripLevelTag("Check (L2) later")).toBe("Check (L2) later");
    expect(stripLevelTag("Get the order_id")).toBe("Get the order_id");
  });
});

describe("meaningfulTerms", () => {
  it("drops filler words and short terms", () => {
    expect(meaningfulTerms(["is", "and", "payment", "an", "no"], "payment is slow")).toEqual([
      "payment",
    ]);
  });

  it("keeps numbers only when the user typed them", () => {
    expect(meaningfulTerms(["504", "004"], "api returns 504")).toEqual(["504"]);
  });
});
