import { test, expect } from "@playwright/test";
import { getAuthoriseUrlForJourney } from "./helpers";

test.describe.parallel("Check Strategic App VC polling for MAM journey", () => {
    test(`Mam success`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceiptMamSuccess`),
      );

      // Check the spinner text
      const spinnerContentLocator = await page.locator('#spinner+div');
      await expect(spinnerContentLocator).toContainText("You can now continue", { timeout: 500 });
      await expect(spinnerContentLocator).toBeVisible();

      // Click continue to success page
      await page.getByRole("button", { name: /Continue/ }).click();

      // Confirm url
      expect(page.url()).toContain("/page-dcmaw-success");

      // Confirm page heading
      const pageHeading = await page.locator("h1").textContent();
      expect(pageHeading).toBe(
        "We’ve successfully matched you to the photo on your ID",
      );
    });

    test(`Mam user abandons app`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceiptMamAbandon`),
      );

      // Check the spinner text
      const spinnerContentLocator = await page.locator('#spinner+div');
      await expect(spinnerContentLocator).toContainText("You can now continue", { timeout: 500 });
      await expect(spinnerContentLocator).toBeVisible();

      // Click continue to multiple-doc page
      await page.getByRole("button", { name: /Continue/ }).click();

      // Confirm url
      expect(page.url()).toContain("/page-multiple-doc-check");

      // Confirm page heading
      const pageHeading = await page.locator("h1").textContent();
      expect(pageHeading).toBe("Continue proving your identity online");
    });

    test(`Mam app error`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceiptMamError`),
      );

      // Check the spinner text
      const spinnerContentLocator = await page.locator('#spinner+div');
      await expect(spinnerContentLocator).toContainText("You can now continue", { timeout: 500 });

      // Click continue to pyi-technical page
      await page.getByRole("button", { name: /Continue/ }).click();

      // Confirm url
      expect(page.url()).toContain("/pyi-technical");

      // Confirm page heading
      const pageHeading = await page.locator("h1").textContent();
      expect(pageHeading).toBe("Sorry, there is a problem");
    });

    test(`Mam pending shows long wait and eventually errors`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceiptMamPending`),
      );

      // Check the spinner text
      const spinnerContentLocator = await page.locator('#spinner+div');

      await expect(spinnerContentLocator).toContainText("This may take a few minutes", { timeout: 500 });
      await expect(spinnerContentLocator).toBeVisible();

      // For these tests the spinner long wait time is set to 2 seconds (see SPINNER_REQUEST_LONG_WAIT_INTERVAL in  compose.yaml)
      await expect(spinnerContentLocator).toContainText("We’re still checking your details", { timeout: 5000 });

      // Check continue button is disabled
      const continueButtonLocator = await page.getByRole("button", {
        name: /Continue/,
      });
      await expect(continueButtonLocator).toBeDisabled();

      // The spinner will time out after 6 seconds total
      await page.waitForURL('**/pyi-technical', { timeout: 6000 });
    });

    test(`Mam bad request goes to technical error page`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceiptMamBadRequest`),
      );

      // The spinner will try 3 times on error responses with exponential back-off before going to the error page
      await page.waitForURL('**/pyi-technical', { timeout: 10000 });
    });

    test(`Mam core-back error goes to technical error page`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceiptMamFailure`),
      );

      // The spinner will try 3 times on error responses with exponential back-off before going to the error page
      await page.waitForURL('**/pyi-technical', { timeout: 10000 });
    });
});
