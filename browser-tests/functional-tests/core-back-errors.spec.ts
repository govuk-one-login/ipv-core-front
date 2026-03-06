import { test, expect } from "@playwright/test";
import { getAuthoriseUrlForJourney } from "./helpers";

test.describe("Error tests", () => {
  test("Handles an unexpected error from core-back", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testUnexpectedError"));
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // Core-back is configured to return an error after selecting submit
    const heading = page.locator("h1");
    await expect(heading).toContainText("Sorry, there is a problem");
    await expect(page.locator("main")).toHaveAttribute("id", "main-content");
    const contactLink = page.getByRole("link", { name: /contact/i });
    await expect(contactLink).toBeVisible();
  });

  test("Handles an unexpected error after a CRI callback", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testCriError"));
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    // Core-back is configured to return a CRI redirect which core-front handles by
    // sending another request to core-back, this time, core-back is configured to
    // return an error
    const textLocator = page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });

  test("Handles error during session creation", async ({ page }) => {
    // Start a session
    await page.goto(getAuthoriseUrlForJourney("testSessionInitialiseError"));

    // Core-back is configured to return an error form the initial /session/initialise call
    const textLocator = page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });
});
