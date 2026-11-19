import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { initialActivities } from "@/lib/carbon";

describe("home page on the App shell", () => {
  it("renders the sample ledger, its total, the honest note and the hub link", () => {
    const html = renderToString(<Home />);
    expect(html).toContain("Carbon Tally");
    for (const item of initialActivities) expect(html).toContain(item.label);
    expect(html).toContain("12.9 kg CO₂e");
    expect(html).toContain("not audited");
    expect(html).toContain("no offset or certification");
    expect(html).toContain('href="https://bookchaowalit.com/"');
  });

  it("publishes sitemap and robots on carbon.bookchaowalit.com", () => {
    expect(sitemap()[0].url).toBe("https://carbon.bookchaowalit.com");
    expect(robots().sitemap).toBe("https://carbon.bookchaowalit.com/sitemap.xml");
  });
});
