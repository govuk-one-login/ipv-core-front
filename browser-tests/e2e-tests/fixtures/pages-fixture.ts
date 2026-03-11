import { errors, expect, Page } from "@playwright/test";
import { Locator } from "playwright-core";
import TimeoutError = errors.TimeoutError;
import { sanitiseUrl } from "../helpers/url-helpers";

export interface PageUtils {
  selectRadio: (value: string) => Promise<void>;
  selectCheckbox: (value: string) => Promise<void>;
  clickButton: (id: string) => Promise<void>;
  selectRadioAndContinue: (value: string) => Promise<void>;
  waitForContinueButtonToBeEnabledThenContinue: (
    timeout: number,
  ) => Promise<void>;
  expectPage: (expectedPage: string) => Promise<void>;
  getContinueButton: () => Locator;
}

export const pageUtils = (page: Page): PageUtils => {
  const selectRadio = async (value: string): Promise<void> =>
    await page.locator(`input[type="radio"][value="${value}"]`).first().check();

  const selectCheckbox = async (value: string): Promise<void> =>
    await page
      .locator(`input[type="checkbox"][value="${value}"]`)
      .first()
      .check();

  const clickButton = async (id: string): Promise<void> => {
    await page.locator(`#${id}`).click();
  };

  const selectRadioAndContinue = async (value: string): Promise<void> => {
    await selectRadio(value);
    await clickButton("submitButton");
  };

  const getContinueButton = (): Locator => {
    return page
      .locator("#submitButton")
      .or(page.locator('button[type="submit"]'))
      .or(page.locator('input[type="submit"]'))
      .first();
  };

  const waitForContinueButtonToBeEnabledThenContinue = async (
    timeout: number,
  ): Promise<void> => {
    const continueButton = getContinueButton();
    await expect(continueButton).toBeEnabled({ timeout: timeout * 1000 });
    await continueButton.click();
  };

  const expectPage = async (expectedPage: string): Promise<void> => {
    try {
      await page.waitForURL(`**/${expectedPage}`, { timeout: 3000 });
    } catch (e) {
      if (e instanceof TimeoutError) {
        const actualPageUrl = sanitiseUrl(page.url());
        throw new Error(
          `Expected "${expectedPage}" but got "${actualPageUrl.slice(actualPageUrl.lastIndexOf("/") + 1)}"`,
          { cause: e },
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
