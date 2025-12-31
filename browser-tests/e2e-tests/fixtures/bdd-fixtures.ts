import { test as baseTest } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { OrchestratorStubPage } from '../pages/orchestrator-stub-page';
import { IdentityPage } from '../pages/identity-page';
import { CICStubPage } from '../pages/cic-stub-page';
import { DocCheckingPage } from '../pages/doc-checking-page';
import { DrivingLicenceStubPage } from '../pages/driving-licence-stub-page';
import { AddressStubPage } from '../pages/address-stub-page';
import { FraudStubPage } from '../pages/fraud-stub-page';
import { F2FStubPage } from '../pages/f2f-stub-page';
import { ApiService } from '../services/api-service';

type PageFixtures = {
  orchestratorPage: OrchestratorStubPage;
  identityPage: IdentityPage;
  cicPage: CICStubPage;
  docCheckingPage: DocCheckingPage;
  drivingLicencePage: DrivingLicenceStubPage;
  addressPage: AddressStubPage;
  fraudPage: FraudStubPage;
  f2fPage: F2FStubPage;
  apiService: ApiService;
  userId: string;
};

export const test = baseTest.extend<PageFixtures>({
  orchestratorPage: async ({ page }, use) => {
    await use(new OrchestratorStubPage(page));
  },
  identityPage: async ({ page }, use) => {
    await use(new IdentityPage(page));
  },
  cicPage: async ({ page }, use) => {
    await use(new CICStubPage(page));
  },
  docCheckingPage: async ({ page }, use) => {
    await use(new DocCheckingPage(page));
  },
  drivingLicencePage: async ({ page }, use) => {
    await use(new DrivingLicenceStubPage(page));
  },
  addressPage: async ({ page }, use) => {
    await use(new AddressStubPage(page));
  },
  fraudPage: async ({ page }, use) => {
    await use(new FraudStubPage(page));
  },
  f2fPage: async ({ page }, use) => {
    await use(new F2FStubPage(page));
  },
  apiService: async ({ request }, use) => {
    await use(new ApiService(request));
  },
  userId: async ({}, use) => {
    let userId = '';
    await use(userId);
  },
});

export { expect };
