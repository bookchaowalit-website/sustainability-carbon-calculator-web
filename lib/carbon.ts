// Activity ledger and pure estimate logic for Carbon Tally.
// Factors are demonstrative defaults kept in the code (kg CO2e per unit), not an audited dataset.

export type Category = "Travel" | "Home" | "Food";
export type Activity = { id: number; label: string; amount: number; unit: string; factor: number; category: Category };
export type Totals = Record<Category, number> & { total: number };

export const categories: Category[] = ["Travel", "Home", "Food"];

export const initialActivities: Activity[] = [
  { id: 1, label: "Motorbike commute", amount: 42, unit: "km", factor: 0.09, category: "Travel" },
  { id: 2, label: "Grid electricity", amount: 18, unit: "kWh", factor: 0.42, category: "Home" },
  { id: 3, label: "Rice meal", amount: 4, unit: "servings", factor: 0.38, category: "Food" },
];

/** Default factor applied to a new line in each category. */
export const factorByCategory: Record<Category, number> = { Travel: 0.04, Home: 0.42, Food: 0.38 };

/** Unit a new line in each category is measured in. */
export const unitByCategory: Record<Category, string> = { Travel: "km", Home: "kWh", Food: "servings" };

export function emission(activity: Pick<Activity, "amount" | "factor">): number {
  return activity.amount * activity.factor;
}

export function computeTotals(activities: Activity[]): Totals {
  return activities.reduce<Totals>(
    (result, item) => {
      const kg = emission(item);
      result.total += kg;
      result[item.category] += kg;
      return result;
    },
    { total: 0, Travel: 0, Home: 0, Food: 0 },
  );
}

/** Width (percent) of a category bar: at least 4% when it has any share, 0 when the ledger is empty. */
export function barWidth(totals: Totals, category: Category): number {
  if (!totals.total) return 0;
  return Math.max(4, (totals[category] / totals.total) * 100);
}

export type NewActivity = { label: string; amount: number; category: Category };

/** Adds a line, or returns the list unchanged when the label is blank or the amount is not a positive number. */
export function addActivity(activities: Activity[], input: NewActivity): Activity[] {
  const label = input.label.trim();
  if (!label || !Number.isFinite(input.amount) || input.amount <= 0) return activities;
  const id = activities.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  return [...activities, { id, label, amount: input.amount, unit: unitByCategory[input.category], factor: factorByCategory[input.category], category: input.category }];
}

export function removeActivity(activities: Activity[], id: number): Activity[] {
  return activities.filter((entry) => entry.id !== id);
}
