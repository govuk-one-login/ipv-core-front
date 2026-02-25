import { expect, Page } from "@playwright/test";

export const pageUtils = (page: Page) => {
  const selectRadio = async (value: string) =>
    await page.locator(`input[type="radio"][value="${value}"]`).check();

  const selectCheckbox = async (value: string) =>
    await page.locator(`input[type="checkbox"][value="${value}"]`).check();

  const clickButton = async (idOrName: string, useName: boolean = false) => {
    const currentUrl = page.url();
    const button = useName
      ? page.getByRole("button", { name: idOrName })
      : page.locator(`#${idOrName}`);
    await button.click();
    // Wait for navigation if the URL changes, otherwise just wait for network to settle
    try {
      await page.waitForURL((url) => url.toString() !== currentUrl, {
        timeout: 15000,
      });
    } catch {
      // Navigation might not always occur (e.g. in-page form submission)
    }
    await page.waitForLoadState("networkidle");
  };

  const selectRadioAndContinue = async (value: string) => {
    await selectRadio(value);
    await clickButton("submitButton");
  };

  const waitForContinueButtonToBeEnabledThenContinue = async (
    timeout: number,
  ) => {
    const continueButton = page
      .locator(
        '#continue, #submitButton, button[type="submit"], button[data-id="next"], button:has-text("Continue")',
      )
      .first();
    await expect(continueButton).toBeEnabled({ timeout: timeout * 1000 });
    await continueButton.click();
  };

  return {
    selectRadio,
    selectCheckbox,
    clickButton,
    selectRadioAndContinue,
    waitForContinueButtonToBeEnabledThenContinue,
  };
};
