import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures/bdd-fixtures';
import { BddContext } from './bdd-context';

const { Given, When, Then } = createBdd(test);

Given('I navigate to Orchestrator Stub and start journey', async ({ orchestratorPage }) => {
  await orchestratorPage.navigate();
  await orchestratorPage.startFullJourney();
});

Given('I enable Feature Flags', async ({ identityPage }) => {
  await identityPage.enableFeatureFlags();
});

Given('I configure TICF Management API', async ({ orchestratorPage, apiService }) => {
  const userId = await orchestratorPage.getUserId();
  expect(userId).toBeTruthy();
  await apiService.configureTicfManagementApi(userId);
  
  // Store userId in BddContext for use in subsequent steps
  BddContext.set('userId', userId);
});

Given('I complete initial P2 identity journey', async ({
  orchestratorPage,
  identityPage,
  docCheckingPage,
  drivingLicencePage,
  addressPage,
  fraudPage,
}) => {
  await orchestratorPage.startFullJourney();
  await identityPage.selectUKLocation();
  await identityPage.confirmEligibility();

  // Process DOC checking evidence
  await docCheckingPage.processAliceParkerValidInitial();

  // Process driving licence evidence
  await drivingLicencePage.expectDrivingLicenceStub();
  await drivingLicencePage.processAliceParkerValid();
  await identityPage.navigateToDcmawSuccess();
  await identityPage.continueFromDcmaw();

  // Process address evidence
  await addressPage.processAliceParkerValidAddress();

  // Process fraud evidence
  await fraudPage.processAliceParkerValid();

  // Complete initial journey at IPV success page
  await identityPage.navigateToIPVSuccess();
  await identityPage.expectIPVSuccess();
  await identityPage.continueToService();
  await orchestratorPage.expectRawUserInfoVisible();
});

When('I start reuse journey for name change', async ({
  orchestratorPage,
  identityPage,
  docCheckingPage,
  drivingLicencePage,
  fraudPage,
}) => {
  const userId = BddContext.get('userId');
  
  await orchestratorPage.navigate();
  await orchestratorPage.setUserId(userId);
  await orchestratorPage.startFullJourney();

  await identityPage.navigateToConfirmDetails();
  await identityPage.selectUpdateDetails();
  await identityPage.selectUpdateNameMethod();

  // Process DOC checking with name change (includes biometric verification)
  await docCheckingPage.processAliceParkerNameChangeInitial();

  // Process driving licence with name change
  await drivingLicencePage.expectDrivingLicenceStub();
  await drivingLicencePage.processAliceParkerNameChange();
  await identityPage.continueFromDcmaw();

  // Process fraud evidence with name change
  await fraudPage.processAliceParkerNameChange();

  // Complete name change journey at IPV success page
  await identityPage.expectIPVSuccess();
  await identityPage.continueToService();
  await orchestratorPage.expectRawUserInfoVisible();
  await orchestratorPage.expandRawUserInfo();
  await orchestratorPage.expectCriTypes();
});

Then('I should see the verify final reuse screen after name change', async ({
  orchestratorPage,
  identityPage,
}) => {
  const userId = BddContext.get('userId');
  
  await orchestratorPage.navigate();
  await orchestratorPage.setUserId(userId);
  await orchestratorPage.startFullJourney();
  await identityPage.expectReuseScreen();
});
