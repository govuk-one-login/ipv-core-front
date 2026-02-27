import { errors, expect, Page } from "@playwright/test";
import TimeoutError = errors.TimeoutError;

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

  const waitForContinueButtonToBeEnabledThenContinue = async (
    timeout: number,
  ) => {
    const continueButton = page
      .locator("#submitButton")
      .or(page.locator('button[type="submit"]'))
      .first();
    await expect(continueButton).toBeEnabled({ timeout: timeout * 1000 });
    await continueButton.click();
  };

  const selectContinueButton = async () => {
    await page
      .locator("#submitButton")
      .or(page.locator('button[type="submit"]'))
      .or(page.locator('input[type="submit"]'))
      .first()
      .click();
  };

  const expectPage = async (expectedPage: string) => {
    try {
      await page.waitForURL(`**/${expectedPage}`, { timeout: 3000 });
    } catch (e) {
      if (e instanceof TimeoutError) {
        throw new Error(`Expected ${expectedPage} but got ${page.url()}`);
      }
    }
  }

  return {
    selectRadio,
    selectCheckbox,
    clickButton,
    selectRadioAndContinue,
    waitForContinueButtonToBeEnabledThenContinue,
    selectContinueButton,
    expectPage
  };
};
