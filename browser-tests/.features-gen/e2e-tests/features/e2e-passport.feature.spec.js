// Generated from: e2e-tests/features/e2e-passport.feature
import { test } from "../../../e2e-tests/fixtures/bdd-fixtures.ts";

test.describe('E2E Passport Journey', () => {

  test('Passport details page happy path', { tag: ['@Build', '@Lamdatesta', '@PYIC-5477', '@PYIC-6863', '@PYIC-7016'] }, async ({ When, Then, And, addressPage, fraudPage, identityPage, kbvPage, orchestratorPage, page, passportPage }) => { 
    await When('user starts a fresh full journey in \'build\'', null, { orchestratorPage }); 
    await And('the \'disableStrategicApp\' feature set is enabled', null, { identityPage }); 
    await And('user selects they are from the UK', null, { identityPage }); 
    await And('clicks continue on the signed into your GOV.UK One Login page in build stub', null, { page }); 
    await And('user enters the data in Passport stub as a PassportSubject', null, { page, passportPage }); 
    await When('user enters data in address stub and clicks on submit data and generate auth code', null, { addressPage, page }); 
    await Then('user should be on Fraud Check (Stub)', null, { page }); 
    await When('user enters data in fraud build stub and clicks on submit data and generate auth code', null, { fraudPage, page }); 
    await And('the user should land onto the PIP page and select \'no\' and continue', null, { page }); 
    await Then('User should be on KBV page and click continue', null, { page }); 
    await When('user enters data in kbv stub and clicks on submit data and generate auth code', null, { kbvPage }); 
    await Then('user should be successful in proving identity', null, { page }); 
    await And('User should be able to see the json response page', null, { page }); 
    await Then('\'vot\' should be set to \'"P2"\' in the raw user info object', null, { page }); 
    await When('user starts a new full journey with the same userId in \'build\'', null, { orchestratorPage }); 
    await Then('the user should be taken to the IPV Reuse Screen with One login changes', null, { identityPage }); 
    await And('Relevant changes for VOT displayed in JSONResponse', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e-tests/features/e2e-passport.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":4,"tags":["@Build","@Lamdatesta","@PYIC-5477","@PYIC-6863","@PYIC-7016"],"steps":[{"pwStepLine":7,"gherkinStepLine":5,"keywordType":"Action","textWithKeyword":"When user starts a fresh full journey in 'build'","stepMatchArguments":[{"group":{"start":36,"value":"'build'","children":[{"children":[{"children":[]}]},{"start":37,"value":"build","children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":6,"keywordType":"Action","textWithKeyword":"And the 'disableStrategicApp' feature set is enabled","stepMatchArguments":[{"group":{"start":4,"value":"'disableStrategicApp'","children":[{"children":[{"children":[]}]},{"start":5,"value":"disableStrategicApp","children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":9,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"And user selects they are from the UK","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"And clicks continue on the signed into your GOV.UK One Login page in build stub","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":9,"keywordType":"Action","textWithKeyword":"And user enters the data in Passport stub as a PassportSubject","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":10,"keywordType":"Action","textWithKeyword":"When user enters data in address stub and clicks on submit data and generate auth code","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"Then user should be on Fraud Check (Stub)","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When user enters data in fraud build stub and clicks on submit data and generate auth code","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"And the user should land onto the PIP page and select 'no' and continue","stepMatchArguments":[{"group":{"start":50,"value":"'no'","children":[{"children":[{"children":[]}]},{"start":51,"value":"no","children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":16,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then User should be on KBV page and click continue","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":15,"keywordType":"Action","textWithKeyword":"When user enters data in kbv stub and clicks on submit data and generate auth code","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then user should be successful in proving identity","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And User should be able to see the json response page","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then 'vot' should be set to '\"P2\"' in the raw user info object","stepMatchArguments":[{"group":{"start":23,"value":"'\"P2\"'","children":[{"children":[{"children":[]}]},{"start":24,"value":"\"P2\"","children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When user starts a new full journey with the same userId in 'build'","stepMatchArguments":[{"group":{"start":55,"value":"'build'","children":[{"children":[{"children":[]}]},{"start":56,"value":"build","children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then the user should be taken to the IPV Reuse Screen with One login changes","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And Relevant changes for VOT displayed in JSONResponse","stepMatchArguments":[]}]},
]; // bdd-data-end