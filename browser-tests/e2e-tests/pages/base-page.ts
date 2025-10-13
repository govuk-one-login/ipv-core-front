import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected page: Page) {}

  protected async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  protected async clickButton(name: string): Promise<void> {
    await this.page.getByRole('button', { name }).click();
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