import { test, expect } from "@playwright/test";
import { getAuthoriseUrlForJourney } from "./helpers";

test.describe("Error tests", () => {
  test("Handles an unexpected error from core-back", async ({ page }) => {
    await page.goto(getAuthoriseUrlForJourney("testUnexpectedError"));
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const textLocator = await page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });

  test("Handles an unexpected error after a CRI callback", async ({ page }) => {
    await page.goto(getAuthoriseUrlForJourney("testCriError"));
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const textLocator = await page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });

  test("Handles error during session creation", async ({ page }) => {
    await page.goto(getAuthoriseUrlForJourney("testSessionError"));

    const textLocator = await page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });

  test("Handles invalid session state", async ({ page }) => {
    await page.goto(getAuthoriseUrlForJourney("testInvalidSession"));
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const textLocator = await page.getByText("Sorry, there is a problem");
    await expect(textLocator).toBeVisible();
  });

  test("Error page has correct accessibility attributes", async ({ page }) => {
    await page.goto(getAuthoriseUrlForJourney("testUnexpectedError"));
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Sorry, there is a problem");
    await expect(page.locator("main")).toHaveAttribute("id", "main-content");
  });

  test("Error page displays contact link", async ({ page }) => {
    await page.goto(getAuthoriseUrlForJourney("testUnexpectedError"));
    await page.click("input[type='radio'][value='appTriage']");
    await page.click("button[id='submitButton']");

    const contactLink = page.getByRole("link", { name: /contact/i });
    await expect(contactLink).toBeVisible();
  });

  test("Handles error with different CRI selection", async ({ page }) => {
    await page.goto(getAuthoriseUrlForJourney("testCriError"));
    
    const radioButtons = page.locator("input[type='radio']");
    const count = await radioButtons.count();
    
    if (count > 1) {
      await radioButtons.nth(1).click();
      await page.click("button[id='submitButton']");
      
      const textLocator = await page.getByText("Sorry, there is a problem");
      await expect(textLocator).toBeVisible();
    }
  });
});
