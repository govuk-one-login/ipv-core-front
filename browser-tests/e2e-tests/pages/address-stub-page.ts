import { StubPage } from './stub-page';

export class AddressStubPage extends StubPage {
  async processAliceParkerValidAddress(): Promise<void> {
    await this.selectTestData('Alice Parker Valid Address');
    await this.submitData();
  }
}