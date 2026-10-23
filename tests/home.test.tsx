import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { initialActivities } from "@/lib/carbon";

describe("home page", () => {
  it("renders the sample ledger, its total and the not-audited notice", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Count what");
    for (const item of initialActivities) expect(html).toContain(item.label);
    expect(html).toContain("12.9");
    expect(html).toContain("ESTIMATE · NOT AUDITED");
    expect(html).toContain("NO OFFSET OR CERTIFICATION");
  });
  it("labels the amount field with the unit of the default category", () => {
    expect(renderToString(<Home />)).toMatch(/AMOUNT \/ (<!-- -->)?km/);
  });
});
