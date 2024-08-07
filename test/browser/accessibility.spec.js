const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright");

test.describe("accessibility test", () => {
  test("should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
    await page.goto("/dev/template/page-ipv-identity-document-start/en");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
