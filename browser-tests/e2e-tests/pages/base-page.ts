import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  protected async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  protected async clickButton(name: string): Promise<void> {
    // Use Promise.all to wait for navigation while clicking
    await Promise.all([
      this.page.waitForNavigation({ timeout: 30000 }).catch(() => {
        // Navigation might not always occur, so we catch and ignore the error
      }),
      this.page.getByRole('button', { name }).click(),
    ]);
    // Wait for the new page to stabilize
    await this.page.waitForLoadState('networkidle');
  }

  protected async selectRadio(name: string): Promise<void> {
    await this.page.getByRole('radio', { name }).check();
  }

  protected async selectCheckbox(name: string): Promise<void> {
    await this.page.getByRole('checkbox', { name }).check();
  }

  protected async fillInput(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
  }

  protected async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }

  protected async expectHeading(name: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name })).toBeVisible();
  }

  protected async expectText(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }
}