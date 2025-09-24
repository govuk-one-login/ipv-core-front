import { test, expect } from '../fixtures/page-fixtures';

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
      
      // DOC checking stub
      await docCheckingPage.processAliceParkerValidInitial();
      
      // Driving licence evidence stub
      await drivingLicencePage.expectDrivingLicenceStub();
      await drivingLicencePage.processAliceParkerValid();
      await identityPage.navigateToDcmawSuccess();
      await identityPage.continueFromDcmaw();
      
      // Address stub
      await addressPage.processAliceParkerValidAddress();
      
      // Fraud stub
      await fraudPage.processAliceParkerValid();
      
      // Verify identity issued
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

      // DOC checking stub
      await docCheckingPage.processAliceParkerNameChangeInitial();

      // Driving licence evidence stub
      await drivingLicencePage.expectDrivingLicenceStub();
      await drivingLicencePage.processAliceParkerNameChange();
      await identityPage.continueFromDcmaw();

      // Fraud stub
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