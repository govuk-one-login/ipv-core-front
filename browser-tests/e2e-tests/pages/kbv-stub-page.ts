import { expect, Page } from '@playwright/test';
import { BasePage } from './base-page';

export class KBVStubPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Mirrors the exact Selenium KBV stub flow:
   * 1. select.selectByValue(testData)
   * 2. kbvscore.sendKeys(score)
   * 3. SelectCRIData.click()  (#test_data — triggers change/blur)
   * 4. waitForPageToLoad()
   * 5. click .govuk-button (submitdatagenerateauth)
   */
  async fillAndSubmit(testData: string, score: string): Promise<void> {
    const testDataSelect = this.page.locator('#test_data');
    const scoreInput = this.page.locator('[name="verificationScore"]');
    const submitButton = this.page.locator('.govuk-button').first();

    await testDataSelect.selectOption({ value: testData });
    await expect(testDataSelect).toHaveValue(testData);
    await scoreInput.fill(score);
    await testDataSelect.click();
    await submitButton.click();
  }
}