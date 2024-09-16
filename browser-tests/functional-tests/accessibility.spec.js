const { test, expect } = require("@playwright/test");
const { iteratePagesAndContexts } = require("../data/pagesAndContexts.js");
const AxeBuilder = require("@axe-core/playwright");

test.describe.parallel("Accessibility tests", () => {
  test.setTimeout(120000);
  iteratePagesAndContexts(
    (pageName, context, language, url) => {
      test(`Accessibility check for ${pageName}, context ${context} and language ${language}`, async ({ page }) => {
        await page.goto(url);
        await assertNoAccessibilityViolations(page);
      });
    }
  );

  (["radio", "checkbox"]).forEach((errorState) => {
    ["en", "cy"].forEach((language) => {
      test(`Accessibility check for ${errorState} error state in ${language}`, async ({ page }) => {
        await page.goto(`http://localhost:4601/dev/template/confirm-your-details/${language}?errorState=${errorState}`);
        await assertNoAccessibilityViolations(page);
      });
    })
  });
});

const assertNoAccessibilityViolations = async (page) => {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag21a', 'wcag21aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
}
