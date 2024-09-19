const { test, expect } = require("@playwright/test");
const { iteratePagesAndContexts } = require("../data/pagesAndContexts.js");
const AxeBuilder = require("@axe-core/playwright");

const domainUrl = process.env.WEBSITE_HOST;

test.describe.parallel("Accessibility tests", () => {
  test.setTimeout(120000);
  iteratePagesAndContexts(
    (pageName, context, language, url) => {
      test(`Accessibility check for ${pageName}, context ${context} and language ${language}`, async ({ page }) => {
        await page.goto(url);

        // Open all summaries on the page
        const allSummaries = await page.locator("summary").all();
        for (const summary of allSummaries) {
          await summary.click();
        }
        const allSummaryDetails = await page.locator(".govuk-details__text").all();
        for (const details of allSummaryDetails) {
          await details.waitFor();
        }

        await assertNoAccessibilityViolations(page);
      });
    }
  );

  (["radio", "checkbox"]).forEach((errorState) => {
    ["en", "cy"].forEach((language) => {
      test(`Accessibility check for ${errorState} error state in ${language}`, async ({ page }) => {
        await page.goto(`${domainUrl}/dev/template/confirm-your-details/${language}?errorState=${errorState}`);
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
