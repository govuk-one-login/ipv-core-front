import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";

const { When, Then } = createBdd(fixtures);

When(
  /^the user selects they are (not )?from the UK$/,
  async ({ pageUtils }, notFromUk?: "not ") => {
    await pageUtils.selectRadioAndContinue(notFromUk ? "international" : "uk");
  },
);

When(
  "the user selects {string} radio option and continues",
  async ({ pageUtils }, radioOption: string) => {
    await pageUtils.selectRadioAndContinue(radioOption);
  },
);

Then(
  "the user should see the {string} page",
  async ({ pageUtils }, expectedPage) => {
    await pageUtils.expectPage(expectedPage);
  },
);

When(
  "the user submits {string} details to the {string} CRI stub",
  async ({ criStubUtils }, scenario: string, cri: string) => {
    await criStubUtils.submitDetailsToCriStub(scenario, cri);
  },
);

When("the user chooses to continue", async ({ pageUtils }) => {
  await pageUtils.selectContinueButton();
});
