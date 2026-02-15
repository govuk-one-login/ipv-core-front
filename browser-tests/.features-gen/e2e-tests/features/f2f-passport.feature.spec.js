// Generated from: e2e-tests/features/f2f-passport.feature
import { test } from "../../../e2e-tests/fixtures/bdd-fixtures.ts";

test.describe('F2F Passport Journey', () => {

  test('F2F Passport claim is returned in the user identity response', { tag: ['@Build', '@PYIC-8131', '@QualityGateRegressionTest'] }, async ({ Given, When, Then, And, addressPage, cicPage, f2fPage, fraudPage, identityPage, orchestratorPage, page }) => { 
    await Given('I navigate to Orchestrator Stub and start journey', null, { orchestratorPage }); 
    await When('I select I am from the UK', null, { identityPage }); 
    await And('I confirm I do not have photo ID suitable for an app journey', null, { identityPage }); 
    await Then('I should see page with heading \'Prove your identity at a Post Office with one of the following types of photo ID\'', null, { page }); 
    await When('I select Yes radio and continue', null, { identityPage }); 
    await And('I enter CIC stub data as Kenneth Decerqueira', null, { cicPage }); 
    await When('I enter address stub data and submit', null, { addressPage }); 
    await When('I enter fraud build stub data and submit', null, { fraudPage }); 
    await And('I enter Face to Face Stub data for valid passport and submit', null, { f2fPage }); 
    await Then('I should see go to post office page without VC', null, { identityPage }); 
    await Then('After User relogin should see passport and identity claim data in Raw User Info Object', null, { identityPage, orchestratorPage, page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e-tests/features/f2f-passport.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":7,"tags":["@Build","@PYIC-8131","@QualityGateRegressionTest"],"steps":[{"pwStepLine":7,"gherkinStepLine":8,"keywordType":"Context","textWithKeyword":"Given I navigate to Orchestrator Stub and start journey","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":9,"keywordType":"Action","textWithKeyword":"When I select I am from the UK","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"And I confirm I do not have photo ID suitable for an app journey","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then I should see page with heading 'Prove your identity at a Post Office with one of the following types of photo ID'","stepMatchArguments":[{"group":{"start":31,"value":"'Prove your identity at a Post Office with one of the following types of photo ID'","children":[{"children":[{"children":[]}]},{"start":32,"value":"Prove your identity at a Post Office with one of the following types of photo ID","children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When I select Yes radio and continue","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"And I enter CIC stub data as Kenneth Decerqueira","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When I enter address stub data and submit","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When I enter fraud build stub data and submit","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"And I enter Face to Face Stub data for valid passport and submit","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then I should see go to post office page without VC","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then After User relogin should see passport and identity claim data in Raw User Info Object","stepMatchArguments":[]}]},
]; // bdd-data-end