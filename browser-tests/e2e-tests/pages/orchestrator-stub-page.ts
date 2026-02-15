import { BasePage } from './base-page';
import { CONFIG } from '../config/test-config';

export class OrchestratorStubPage extends BasePage {
  async navigate(): Promise<void> {
    await this.navigateTo(CONFIG.URLS.ORCHESTRATOR_STUB);
  }

  async startFullJourney(): Promise<void> {
    await this.clickButton('Full journey route');
  }

  async getUserId(): Promise<string> {
    await this.page.waitForLoadState('networkidle');
    return await this.page.getByRole('textbox', { name: 'Enter userId manually' }).inputValue();
  }

  async setUserId(userId: string): Promise<void> {
    await this.page.getByRole('textbox', { name: 'Enter userId manually' }).fill(userId);
  }

  async expectRawUserInfoVisible(): Promise<void> {
    await this.expectText('Raw User Info Object');
  }

  async expandRawUserInfo(): Promise<void> {
    await this.page.locator('summary').filter({ hasText: 'Raw User Info Object' }).click();
  }

  async expectCriTypes(): Promise<void> {
    const expectedCriTypes = [
      'Cri Type: https://address-cri',
      'Cri Type: https://dcmaw-cri.',
      'Cri Type: https://driving-',
      'Cri Type: https://fraud-cri.',
      'Cri Type: https://cimit.stubs',
      'Cri Type: https://ticf.stubs.'
    ];
    for (const criType of expectedCriTypes) {
      await this.expectText(criType);
    }
  }

  async expectF2FCriTypes(): Promise<void> {
    const expectedCriTypes = [
      'Cri Type: https://address-cri',
      'Cri Type: https://fraud-cri.',
      'Cri Type: https://f2f-cri.',
      'Cri Type: https://claimed-identity-cri.',
      'Cri Type: https://cimit.stubs',
      'Cri Type: https://ticf.stubs.'
    ];
    for (const criType of expectedCriTypes) {
      await this.expectText(criType);  
    }
  }
}