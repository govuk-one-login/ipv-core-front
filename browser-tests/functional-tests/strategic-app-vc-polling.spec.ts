import { test, expect } from "@playwright/test";
import { getAuthoriseUrlForJourney } from "./helpers";

type JourneyType = "Mam" | "Dad";

interface JourneyConfig {
  successSpinnerText: string;
  pendingInitialText: string;
  pendingLongWaitText: string;
}

const journeyConfigs: Record<JourneyType, JourneyConfig> = {
  Mam: {
    successSpinnerText: "You can now continue",
    pendingInitialText: "This may take a few minutes",
    pendingLongWaitText: "We’re still checking your details",
  },
  Dad: {
    successSpinnerText: "You can now finish proving your identity online.",
    pendingInitialText:
      "Waiting for you to open the app. Keep this page open while you do this.",
    pendingLongWaitText: "Once you’ve submitted your information in the app",
  },
};

test.describe.parallel("Check Strategic App VC polling", () => {
  (["Mam", "Dad"] as JourneyType[]).forEach((journeyType) => {
    const config = journeyConfigs[journeyType];

    test(`${journeyType} success`, async ({ page }) => {
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Success`),
      );

      const spinnerContentLocator = await page.locator("#spinner+div");
      await expect(spinnerContentLocator).toContainText(
        config.successSpinnerText,
        { timeout: 500 },
      );
      await expect(spinnerContentLocator).toBeVisible();

      await page.getByRole("button", { name: /Continue/ }).click();

      expect(page.url()).toContain("/page-dcmaw-success");

      const pageHeading = await page.locator("h1").textContent();
      expect(pageHeading?.trim()).toBe(
        "We’ve successfully matched you to the photo on your ID",
      );
    });

    test(`${journeyType} user abandons app`, async ({ page }) => {
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Abandon`),
      );

      const spinnerContentLocator = await page.locator("#spinner+div");
      await expect(spinnerContentLocator).toContainText(
        config.successSpinnerText,
        { timeout: 500 },
      );
      await expect(spinnerContentLocator).toBeVisible();

      await page.getByRole("button", { name: /Continue/ }).click();

      expect(page.url()).toContain("/page-multiple-doc-check");

      const pageHeading = await page.locator("h1").textContent();
      expect(pageHeading?.trim()).toBe("Continue proving your identity online");
    });

    test(`${journeyType} app error`, async ({ page }) => {
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Error`),
      );

      const spinnerContentLocator = await page.locator("#spinner+div");
      await expect(spinnerContentLocator).toContainText(
        config.successSpinnerText,
        { timeout: 500 },
      );

      await page.getByRole("button", { name: /Continue/ }).click();

      expect(page.url()).toContain("/pyi-technical");

      const pageHeading = await page.locator("h1").textContent();
      expect(pageHeading?.trim()).toBe("Sorry, there is a problem");
    });

    test(`${journeyType} pending shows long wait and eventually errors`, async ({
      page,
    }) => {
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Pending`),
      );

      const spinnerContentLocator = await page.locator("#spinner+div");
      await expect(spinnerContentLocator).toContainText(
        config.pendingInitialText,
        { timeout: 500 },
      );
      await expect(spinnerContentLocator).toBeVisible();

      // For these tests the spinner long wait time is set to 2 seconds (see SPINNER_REQUEST_LONG_WAIT_INTERVAL in compose.yaml)
      await expect(spinnerContentLocator).toContainText(
        config.pendingLongWaitText,
        { timeout: 5000 },
      );

      const continueButtonLocator = await page.getByRole("button", {
        name: /Continue/,
      });
      await expect(continueButtonLocator).toBeDisabled();

      // The spinner will time out after 6 seconds total
      await page.waitForURL("**/pyi-technical", { timeout: 6000 });
    });

    test(`${journeyType} bad request goes to technical error page`, async ({
      page,
    }) => {
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}BadRequest`),
      );

      // The spinner will try 3 times on error responses with exponential back-off before going to the error page
      await page.waitForURL("**/pyi-technical", { timeout: 10000 });
    });

    test(`${journeyType} core-back error goes to technical error page`, async ({
      page,
    }) => {
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Failure`),
      );

      // The spinner will try 3 times on error responses with exponential back-off before going to the error page
      await page.waitForURL("**/pyi-technical", { timeout: 10000 });
    });
  });
});
