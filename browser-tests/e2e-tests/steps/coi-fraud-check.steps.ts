import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures/bdd-fixtures';
import { BddContext } from './bdd-context';

const { Given, When, Then } = createBdd(test);

Given('I navigate to Orchestrator Stub and start journey', async ({ orchestratorPage }) => {
  await orchestratorPage.navigate();
  const userId = await orchestratorPage.getUserId();
  expect(userId).toBeTruthy();
  BddContext.set('userId', userId);
  await orchestratorPage.startFullJourney();

});

Given('I enable Feature Flags', async ({ identityPage }) => {
  await identityPage.enableFeatureFlags();
});

Given('I configure TICF Management API', async ({ orchestratorPage, apiService }) => {
  // Use the userId stored from the initial navigation — page is no longer on orchestrator stub
  const userId = BddContext.get('userId');
  expect(userId).toBeTruthy();
  await apiService.configureTicfManagementApi(userId);
});

Given('I complete initial P2 identity journey', async ({
  orchestratorPage,
  identityPage,
  docCheckingPage,
  drivingLicencePage,
  addressPage,
  fraudPage,
}) => {
  // Journey already started in background step — continue from identity page
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

  // Don't navigate directly — startFullJourney() routes returning P2 users to confirm-your-details
  await identityPage.expectConfirmDetailsPage();
  await identityPage.selectUpdateDetails();
  await identityPage.selectUpdateNameMethod();

  // Process DOC checking with name change (includes biometric verification)
  await docCheckingPage.processAliceParkerNameChangeInitial();

  // Process driving licence with name change
  await drivingLicencePage.expectDrivingLicenceStub();
  await drivingLicencePage.processAliceParkerNameChange();
  // Selenium: enterStubDLDetailsDLAuthCheck calls clickSubmitAuth() then clickContinue()
  // The DL submit lands on a DCMAW success page — need to click continue
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
