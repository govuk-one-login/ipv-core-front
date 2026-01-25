import { test, expect } from '../fixtures/bdd-fixtures';

test.describe('COI Fraud Check - Given Name Change', () => {
  let userId: string;

  test('should pass successfully for a given name change and show reuse screen', async ({
    orchestratorPage,
    identityPage,
    docCheckingPage,
    drivingLicencePage,
    addressPage,
    fraudPage,
    apiService,
  }) => {
    
    await test.step('Navigate to Orchestrator Stub and start journey', async () => {
      await orchestratorPage.navigate();
      await orchestratorPage.startFullJourney();
    });
    
    await test.step('Enable Feature Flags', async () => {
      await identityPage.enableFeatureFlags();
    });

    await test.step('Configure TICF Management API', async () => {
      userId = await orchestratorPage.getUserId();
      expect(userId).toBeTruthy();
      await apiService.configureTicfManagementApi(userId);
    });

    await test.step('Complete initial P2 identity journey', async () => {
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

    await test.step('Start reuse journey for name change', async () => {
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

    await test.step('Verify final reuse screen after name change', async () => {
      await orchestratorPage.navigate();
      await orchestratorPage.setUserId(userId);
      await orchestratorPage.startFullJourney();
      await identityPage.expectReuseScreen();
    });
  });
});