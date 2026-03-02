import { errors, expect, Page } from "@playwright/test";
import TimeoutError = errors.TimeoutError;
import { sanitiseUrl } from "../helpers/url-helpers";

export const pageUtils = (page: Page) => {
  const selectRadio = async (value: string) =>
    await page.locator(`input[type="radio"][value="${value}"]`).first().check();

  const selectCheckbox = async (value: string) =>
    await page
      .locator(`input[type="checkbox"][value="${value}"]`)
      .first()
      .check();

  const clickButton = async (id: string) => {
    await page.locator(`#${id}`).click();
  };

  const selectRadioAndContinue = async (value: string) => {
    await selectRadio(value);
    await clickButton("submitButton");
  };

  const getContinueButton = () => {
    return page
      .locator("#submitButton")
      .or(page.locator('button[type="submit"]'))
      .or(page.locator('input[type="submit"]'))
      .first();
  };

  const waitForContinueButtonToBeEnabledThenContinue = async (
    timeout: number,
  ) => {
    const continueButton = getContinueButton();
    await expect(continueButton).toBeEnabled({ timeout: timeout * 1000 });
    await continueButton.click();
  };

  const expectPage = async (expectedPage: string) => {
    try {
      await page.waitForURL(`**/${expectedPage}`, { timeout: 3000 });
    } catch (e) {
      if (e instanceof TimeoutError) {
        const actualPageUrl = sanitiseUrl(page.url());
        throw new Error(
          `Expected "${expectedPage}" but got "${actualPageUrl.slice(actualPageUrl.lastIndexOf("/") + 1)}"`,
        );
      }
    }
  };

  return {
    selectRadio,
    selectCheckbox,
    clickButton,
    selectRadioAndContinue,
    waitForContinueButtonToBeEnabledThenContinue,
    expectPage,
    getContinueButton,
  };
};
