import { expect } from "@playwright/test";
import { BasePage } from "./base-page";
import { CONFIG } from "../config/test-config";

export class IdentityPage extends BasePage {
  async enableFeatureFlags(featureSet: string): Promise<void> {
    const baseUrl = CONFIG.URLS.IDENTITY_BUILD;
    const url = `${baseUrl}/ipv/usefeatureset?featureSet=${featureSet}`;

    await this.navigateTo(url);
    await this.page.waitForLoadState("networkidle");
    // Navigate back to the journey
    try {
      await this.page.goBack();
      await this.page.waitForLoadState("networkidle");
    } catch (e) {
      // Ignore if there's no history to go back
    }
  }

  async selectUKLocation(): Promise<void> {
    await this.selectRadio("uk");
    await this.clickButton("submitButton");
  }

  async selectNoPhotoID(): Promise<void> {
    await this.selectRadio("end");
    await this.clickButton("submitButton");
  }

  async selectYesPhotoID(): Promise<void> {
    await this.selectRadio("next");
    await this.clickButton("submitButton");
  }

  async confirmEligibility(): Promise<void> {
    await this.selectRadio("appTriage");
    await this.clickButton("submitButton");
  }

  async navigateToConfirmDetails(): Promise<void> {
    await this.navigateTo(
      `${CONFIG.URLS.IDENTITY_BUILD}/ipv/page/confirm-your-details`,
    );
  }

  async selectUpdateDetails(): Promise<void> {
    await this.selectRadio("no");
    await this.selectCheckbox("givenNames");
    await this.clickButton("submitButton");
  }

  async selectUpdateNameMethod(): Promise<void> {
    await this.selectRadio("update-name");
    await this.clickButton("submitButton");
  }

  async continueFromDcmaw(): Promise<void> {
    await this.clickButton("submitButton");
  }

  async expectIPVSuccess(): Promise<void> {
    expect(this.page.url()).toEqual(
      `${CONFIG.URLS.CORE}/ipv/page/page-ipv-success`,
    );
    await expect(
      this.page.getByRole("button", { name: "Continue to the service" }),
    ).toBeEnabled();
  }

  async continueToService(): Promise<void> {
    // Selenium CONTINUE_BUTTON = ByAll(#continue, #submitButton, button[type="submit"], ...)
    const continueBtn = this.page
      .locator('#continue, #submitButton, button[type="submit"]')
      .first();
    const currentUrl = this.page.url();
    await continueBtn.click();
    // Wait for navigation away from the current page (avoids deprecated waitForNavigation race)
    await this.page.waitForURL((url) => url.toString() !== currentUrl, {
      timeout: 30000,
    });
    // Wait for the full redirect chain to settle — networkidle can fire prematurely
    // between redirects, so wait for load first then networkidle
    await this.page.waitForLoadState("load");
    await this.page.waitForLoadState("networkidle");
  }

  async expectReuseScreen(): Promise<void> {
    expect(this.page.url()).toEqual(
      `${CONFIG.URLS.CORE}/ipv/page/page-ipv-reuse`,
    );
    await this.expectText("ALISON JANE PARKER");
    await this.expectText("80TYEOMAN WAYTROWBRIDGEBA14");
    await this.expectText("January 1970");
  }

  async expectReuseScreenForKenneth(): Promise<void> {
    expect(this.page.url()).toEqual(
      `${CONFIG.URLS.CORE}/ipv/page/page-ipv-reuse`,
    );
    await this.expectText("KENNETH DECERQUEIRA");
    await this.expectText("8, HADLEY ROAD");
    await this.expectText("BATH");
    await this.expectText("BA2 5AA");
    await this.expectText("8 July 1965");
  }

  async expectPostOfficeHeading(): Promise<void> {
    expect(this.page.url()).toEqual(
      `${CONFIG.URLS.CORE}/ipv/page/page-face-to-face-handoff`,
    );
  }
}
