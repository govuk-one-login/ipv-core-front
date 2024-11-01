import { test, expect } from "@playwright/test";
import { getAuthoriseUrlForJourney } from "./helpers";

test.describe("Error tests", () => {
  test("Handles an unexpected error from core-back", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testUnexpectedError"));

    // Go to the DCMAW CRI
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

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
