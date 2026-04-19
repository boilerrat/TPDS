import { describe, expect, it } from "vitest";

import { tableToHtml } from "../index";
import { loadFixture } from "./helpers";

describe("tableToHtml", () => {
  it("renders semantic table sections and notes", () => {
    const html = tableToHtml(loadFixture("simple-table"));
    expect(html).toContain("<table>");
    expect(html).toContain("<caption>Quarterly revenue and margin by region.</caption>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain('class="tpds-footnotes"');
  });

  it("preserves rowspan and colspan for merged cells", () => {
    const html = tableToHtml(loadFixture("merged-cells-table"));
    expect(html).toContain('rowspan="2"');
    expect(html).toContain('colspan="2"');
  });
});
