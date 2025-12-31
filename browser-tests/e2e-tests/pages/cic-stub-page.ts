import { StubPage } from './stub-page';

export class CICStubPage extends StubPage {
  async expectCICStub(): Promise<void> {
    await this.expectHeading('Change Identity Check (Stub)');
  }

  async processKennethDecerqueira(): Promise<void> {
    await this.selectTestData('Kenneth Decerqueira');
    await this.submitData();
  }

  async processAliceParkerValid(): Promise<void> {
    await this.selectTestData('Alice Parker (Valid)');
    await this.submitData();
  }
}
