import { test, expect } from "@playwright/test";
import { getAuthoriseUrlForJourney } from "./helpers";

test.describe.parallel("Check Strategic App VC polling", () => {
  ["Mam", "Dad"].forEach((journeyType) => {
    test(`${journeyType} success`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Success`),
      );

      // Check the spinner text
      const spinnerTextLocator = await page.getByText("You can now continue");
      await expect(spinnerTextLocator).toBeVisible();

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

    test(`${journeyType} abandon`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Abandon`),
      );

      // Check the spinner text
      const spinnerTextLocator = await page.getByText("You can now continue");
      await expect(spinnerTextLocator).toBeVisible();

      // Click continue to multiple-doc page
      await page.getByRole("button", { name: /Continue/ }).click();

      // Confirm url
      expect(page.url()).toContain("/page-multiple-doc-check");

      // Confirm page heading
      const pageHeading = await page.locator("h1").textContent();
      expect(pageHeading).toBe("Continue proving your identity online");
    });

    test(`${journeyType} error`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Error`),
      );

      // Check the spinner text
      const spinnerTextLocator = await page.getByText("You can now continue");
      await expect(spinnerTextLocator).toBeVisible();

      // Click continue to pyi-technical page
      await page.getByRole("button", { name: /Continue/ }).click();

      // Confirm url
      expect(page.url()).toContain("/pyi-technical");

      // Confirm page heading
      const pageHeading = await page.locator("h1").textContent();
      expect(pageHeading).toBe("Sorry, there is a problem");
    });

    test(`${journeyType} pending`, async ({ page }) => {
      test.setTimeout(90000);

      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Pending`),
      );

      // Check the spinner text
      const normalSpinnerTextLocator = await page.getByText(
        "This may take a few minutes.",
      );
      await expect(normalSpinnerTextLocator).toBeVisible();

      // Check the spinner text
      const longWaitSpinnerTextLocator = await page.getByText(
        "We’re still checking your details. Do not close or refresh this page.",
      );
      await expect(longWaitSpinnerTextLocator).toBeVisible({ timeout: 65000 });

      // Check continue button is disabled
      const continueButtonLocator = await page.getByRole("button", {
        name: /Continue/,
      });
      await expect(continueButtonLocator).toBeDisabled();
    });

    test(`${journeyType} failure`, async ({ page }) => {
      // Start session with existing identity
      await page.goto(
        getAuthoriseUrlForJourney(`checkVcReceipt${journeyType}Failure`),
      );

      // MAM and DAD handle errors differently. DAD must use custom spinner code due to being integrated into the
      // download page. It cannot refresh the entire page's content, so redirects to pyi-technical instead.

      // Confirm page heading
      const pageHeading = await page.locator("h1").textContent();
      expect(pageHeading).toBe("Sorry, there is a problem");
    });
  });
});

test(`Mam pending`, async ({ page }) => {
  test.setTimeout(90000);

  // Start session with existing identity
  await page.goto(getAuthoriseUrlForJourney(`checkVcReceiptMamPending`));

  // Check the spinner text
  const normalSpinnerTextLocator = await page.getByText(
    "This may take a few minutes.",
  );
  await expect(normalSpinnerTextLocator).toBeVisible();

  // Check the spinner text
  const longWaitSpinnerTextLocator = await page.getByText(
    "We’re still checking your details. Do not close or refresh this page.",
  );
  await expect(longWaitSpinnerTextLocator).toBeVisible({ timeout: 65000 });

  // Check continue button is disabled
  const continueButtonLocator = await page.getByRole("button", {
    name: /Continue/,
  });
  await expect(continueButtonLocator).toBeDisabled();
});
