import { Page, expect } from "@playwright/test";

export abstract class BasePage {
  constructor(protected page: Page) {}

  protected async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
  }

  protected async clickButton(
    idOrName: string,
    useName: boolean = false,
  ): Promise<void> {
    const currentUrl = this.page.url();
    const button = useName
      ? this.page.getByRole("button", { name: idOrName })
      : this.page.locator(`#${idOrName}`);
    await button.click();
    // Wait for navigation if the URL changes, otherwise just wait for network to settle
    try {
      await this.page.waitForURL((url) => url.toString() !== currentUrl, {
        timeout: 15000,
      });
    } catch {
      // Navigation might not always occur (e.g. in-page form submission)
    }
    await this.page.waitForLoadState("networkidle");
  }

  protected async selectRadio(value: string): Promise<void> {
    await this.page.locator(`input[type="radio"][value="${value}"]`).check();
  }

  protected async selectCheckbox(value: string): Promise<void> {
    await this.page.locator(`input[type="checkbox"][value="${value}"]`).check();
  }

  protected async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }

  protected async expectText(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }
}
