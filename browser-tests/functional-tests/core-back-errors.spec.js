const { test, expect } = require("@playwright/test");
const { getAuthoriseUrlForJourney } = require("./helpers");

test.describe("Error tests", () => {
  test("Handles an unexpected error from core-back", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testError"));

    // Go to the error
    await page.goto("/ipv/journey/page-ipv-identity-document-start/error")

    // When we come back with an error
    const textLocator = await page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });

  test("Handles an unexpected error after a CRI callback", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testCriError"));

    // Go to the DCMAW CRI
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // When we come back from DCMAW with an error
    const textLocator = await page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });
});
