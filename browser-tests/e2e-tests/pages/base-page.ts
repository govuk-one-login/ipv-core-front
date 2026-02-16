import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  protected async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  protected async clickButton(name: string): Promise<void> {
    const currentUrl = this.page.url();
    await this.page.getByRole('button', { name }).click();
    // Wait for navigation if the URL changes, otherwise just wait for network to settle
    try {
      await this.page.waitForURL((url) => url.toString() !== currentUrl, { timeout: 15000 });
    } catch {
      // Navigation might not always occur (e.g. in-page form submission)
    }
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