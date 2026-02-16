import { expect } from '@playwright/test';
import { BasePage } from './base-page';
import { CONFIG } from '../config/test-config';

export class IdentityPage extends BasePage {
  async enableFeatureFlags(featureSet?: string): Promise<void> {
    let url = CONFIG.FEATURE_FLAGS.ENABLE_URL;
    // If a specific feature set is passed, build the URL with that feature set
    if (featureSet) {
      const baseUrl = CONFIG.URLS.IDENTITY_BUILD;
      url = `${baseUrl}/ipv/usefeatureset?featureSet=${featureSet}`;
    }
    await this.navigateTo(url);
    await this.page.waitForLoadState('networkidle');
    // Navigate back to the journey
    try {
      await this.page.goBack();
      await this.page.waitForLoadState('networkidle');
    } catch (e) {
      // Ignore if there's no history to go back
    }
  }

  async selectUKLocation(): Promise<void> {
    await this.selectRadio('UK, Channel Islands or Isle');
    await this.clickButton('Continue');
  }

  async selectNoPhotoID(): Promise<void> {
    await this.selectRadio('No');
    await this.clickButton('Continue');
  }

  async selectYesPhotoID(): Promise<void> {
    await this.selectRadio('Yes');
    await this.clickButton('Continue');
  }

  async confirmEligibility(): Promise<void> {
    await this.selectRadio('Yes');
    await this.clickButton('Continue');
  }

  async navigateToConfirmDetails(): Promise<void> {
    await this.navigateTo(`${CONFIG.URLS.IDENTITY_BUILD}/ipv/page/confirm-your-details`);
  }
  // Selenium: assertEquals("You need to confirm your details", commonElements.getHeader("confirm-your-details"))
  async expectConfirmDetailsPage(): Promise<void> {
    await this.expectHeading('You need to confirm your details');
  }

  async selectUpdateDetails(): Promise<void> {
    await this.selectRadio('No - I need to update my');
    await this.selectCheckbox('Given names');
    await this.clickButton('Continue');
  }

  async selectUpdateNameMethod(): Promise<void> {
    await this.selectRadio('Update your name using the');
    await this.clickButton('Continue');
  }

  async navigateToDcmawSuccess(): Promise<void> {
    await this.navigateTo(`${CONFIG.URLS.IDENTITY_BUILD}/ipv/page/page-dcmaw-success`);
  }

  async navigateToIPVSuccess(): Promise<void> {
    await this.navigateTo(`${CONFIG.URLS.IDENTITY_BUILD}/ipv/page/page-ipv-success`);
  }

  async continueFromDcmaw(): Promise<void> {
    await this.clickButton('Continue');
  }

  async expectIPVSuccess(): Promise<void> {
    await this.expectHeading('Continue to the service you need to use');
    await expect(this.page.getByRole('button', { name: 'Continue to the service' })).toBeEnabled();
  }

  async continueToService(): Promise<void> {
    // Selenium CONTINUE_BUTTON = ByAll(#continue, #submitButton, button[type="submit"], ...)
    const continueBtn = this.page.locator('#continue, #submitButton, button[type="submit"]').first();
    const currentUrl = this.page.url();
    await continueBtn.click();
    // Wait for navigation away from the current page (avoids deprecated waitForNavigation race)
    await this.page.waitForURL((url) => url.toString() !== currentUrl, { timeout: 30000 });
    // Wait for the full redirect chain to settle — networkidle can fire prematurely
    // between redirects, so wait for load first then networkidle
    await this.page.waitForLoadState('load');
    await this.page.waitForLoadState('networkidle');
  }

  async expectReuseScreen(): Promise<void> {
    await expect(this.page.locator('#header')).toContainText('You have already proved your identity');
    await this.expectText('ALISON JANE PARKER');
    await this.expectText('80TYEOMAN WAYTROWBRIDGEBA14');
    await this.expectText('January 1970');
  }

  async expectReuseScreenForKenneth(): Promise<void> {
    await expect(this.page.locator("#header")).toContainText(
      "You have already proved your identity",
      { timeout: 10000 }
    );
    await this.expectText("KENNETH DECERQUEIRA");
    await this.expectText("8, HADLEY ROAD");
    await this.expectText("BATH");
    await this.expectText("BA2 5AA");
    await this.expectText("8 July 1965");
  }

  async expectPostOfficeHeading(): Promise<void> {
    await this.page
      .getByRole('heading', {
        name: 'Finish proving your identity at a Post Office',
      })
      .waitFor({ state: 'visible', timeout: 10000 });
  }

}