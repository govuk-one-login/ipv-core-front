import { expect } from '@playwright/test';
import { BasePage } from './base-page';
import { CONFIG } from '../config/test-config';

export class IdentityPage extends BasePage {
  async enableFeatureFlags(): Promise<void> {
    await this.navigateTo(CONFIG.FEATURE_FLAGS.ENABLE_URL);
    await this.page.goBack();
    await this.page.goBack();
  }

  async selectUKLocation(): Promise<void> {
    await this.selectRadio('UK, Channel Islands or Isle');
    await this.clickButton('Continue');
  }

  async confirmEligibility(): Promise<void> {
    await this.selectRadio('Yes');
    await this.clickButton('Continue');
  }

  async navigateToConfirmDetails(): Promise<void> {
    await this.navigateTo(`${CONFIG.URLS.IDENTITY_BUILD}/ipv/page/confirm-your-details`);
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
    await this.clickButton('Continue to the service');
  }

  async expectReuseScreen(): Promise<void> {
    await expect(this.page.locator('#header')).toContainText('You have already proved your identity');
    await this.expectText('ALISON JANE PARKER');
    await this.expectText('80TYEOMAN WAYTROWBRIDGEBA14');
    await this.expectText('January 1970');
  }
}