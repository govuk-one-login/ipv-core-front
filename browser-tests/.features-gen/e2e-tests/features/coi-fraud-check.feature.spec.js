// Generated from: e2e-tests/features/coi-fraud-check.feature
import { test } from "../../../e2e-tests/fixtures/bdd-fixtures.ts";

test.describe('COI Fraud Check - Given Name Change', () => {

  test.beforeEach('Background', async ({ Given, And, apiService, identityPage, orchestratorPage }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to Orchestrator Stub and start journey', null, { orchestratorPage }); 
    await And('I enable Feature Flags', null, { identityPage }); 
    await And('I configure TICF Management API', null, { apiService, orchestratorPage }); 
  });
  
  test('Pass successfully for a given name change and show reuse screen', async ({ Given, When, Then, addressPage, docCheckingPage, drivingLicencePage, fraudPage, identityPage, orchestratorPage }) => { 
    await Given('I complete initial P2 identity journey', null, { addressPage, docCheckingPage, drivingLicencePage, fraudPage, identityPage, orchestratorPage }); 
    await When('I start reuse journey for name change', null, { docCheckingPage, drivingLicencePage, fraudPage, identityPage, orchestratorPage }); 
    await Then('I should see the verify final reuse screen after name change', null, { identityPage, orchestratorPage }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e-tests/features/coi-fraud-check.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":12,"pickleLine":11,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given I navigate to Orchestrator Stub and start journey","isBg":true,"stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"And I enable Feature Flags","isBg":true,"stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":9,"keywordType":"Context","textWithKeyword":"And I configure TICF Management API","isBg":true,"stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":12,"keywordType":"Context","textWithKeyword":"Given I complete initial P2 identity journey","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When I start reuse journey for name change","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then I should see the verify final reuse screen after name change","stepMatchArguments":[]}]},
]; // bdd-data-end