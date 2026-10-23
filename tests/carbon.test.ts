import { describe, expect, it } from "vitest";
import { addActivity, barWidth, computeTotals, emission, initialActivities, removeActivity, unitByCategory, type Activity } from "@/lib/carbon";

describe("estimate", () => {
  it("multiplies amount by factor for each line", () => {
    expect(emission({ amount: 42, factor: 0.09 })).toBeCloseTo(3.78);
  });
  it("totals the sample ledger by category", () => {
    const totals = computeTotals(initialActivities);
    expect(totals.Travel).toBeCloseTo(3.78);
    expect(totals.Home).toBeCloseTo(7.56);
    expect(totals.Food).toBeCloseTo(1.52);
    expect(totals.total).toBeCloseTo(12.86);
  });
  it("returns zeros for an empty ledger", () => {
    expect(computeTotals([])).toEqual({ total: 0, Travel: 0, Home: 0, Food: 0 });
  });
});

describe("barWidth", () => {
  it("is 0 when nothing is logged and at least 4% for a tiny share", () => {
    expect(barWidth(computeTotals([]), "Food")).toBe(0);
    const totals = computeTotals([
      { id: 1, label: "a", amount: 1000, unit: "kWh", factor: 1, category: "Home" },
      { id: 2, label: "b", amount: 1, unit: "km", factor: 0.01, category: "Travel" },
    ]);
    expect(barWidth(totals, "Travel")).toBe(4);
    expect(barWidth(totals, "Home")).toBeCloseTo(100, 0);
  });
});

describe("addActivity", () => {
  it("adds a trimmed line with the category's default factor", () => {
    const next = addActivity(initialActivities, { label: "  Train trip ", amount: 12, category: "Travel" });
    expect(next).toHaveLength(4);
    expect(next[3]).toMatchObject({ label: "Train trip", amount: 12, factor: 0.04, unit: "km", category: "Travel" });
  });

  it("measures a new line in the unit of its category, not always km", () => {
    const home = addActivity([], { label: "Air conditioner", amount: 5, category: "Home" });
    const food = addActivity([], { label: "Noodle bowl", amount: 2, category: "Food" });
    expect(home[0].unit).toBe("kWh");
    expect(food[0].unit).toBe("servings");
    expect(unitByCategory).toEqual({ Travel: "km", Home: "kWh", Food: "servings" });
  });

  it("rejects a blank label, zero, negative or non-numeric amount", () => {
    const base: Activity[] = [];
    expect(addActivity(base, { label: "   ", amount: 3, category: "Food" })).toBe(base);
    expect(addActivity(base, { label: "x", amount: 0, category: "Food" })).toBe(base);
    expect(addActivity(base, { label: "x", amount: -1, category: "Food" })).toBe(base);
    expect(addActivity(base, { label: "x", amount: Number.NaN, category: "Food" })).toBe(base);
    expect(addActivity(base, { label: "x", amount: Number.POSITIVE_INFINITY, category: "Food" })).toBe(base);
  });

  it("gives every new line a unique id, even when two are added at once", () => {
    const once = addActivity(initialActivities, { label: "a", amount: 1, category: "Food" });
    const twice = addActivity(once, { label: "b", amount: 1, category: "Food" });
    expect(new Set(twice.map((item) => item.id)).size).toBe(twice.length);
  });
});

describe("removeActivity", () => {
  it("removes only the matching line", () => {
    const next = removeActivity(initialActivities, 2);
    expect(next.map((item) => item.id)).toEqual([1, 3]);
    expect(removeActivity(initialActivities, 99)).toEqual(initialActivities);
  });
});
