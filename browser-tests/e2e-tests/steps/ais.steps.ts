import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import fixtures from "../fixtures";
import { configureAisIntervention } from "../clients/ais-management-client";
import config from "../config";

const { Given, When, Then } = createBdd(fixtures);

/**
 * Configures the AIS (Account Intervention Service) stub to return a specific
 * intervention result for the current user. Must be called after the journey has
 * started so that scenarioContext.userId is populated.
 *
 * Mirrors: @Given("The AIS API will return an {string} result") in AISSteps.java
 */
Given(
  "the AIS API will return an {string} result",
  async ({ scenarioContext }, intervention: string): Promise<void> => {
    const userId = scenarioContext.userId;
    if (!userId) {
      throw new Error(
        "scenarioContext.userId is not set — start a journey before configuring AIS",
      );
    }
    await configureAisIntervention(userId, intervention);
  },
);

/**
 * Activates a named feature set by navigating to the /usefeatureset endpoint on
 * the current page URL.
 *
 * Mirrors: @When("user enables features {string}") in LoginSteps.java which calls
 * ProveYourIdentityGovUkPage.enableAFeatureSet().
 */
Given(
  "the AIS feature set {string} is enabled",
  async ({ page }, featureSet: string): Promise<void> => {
    const featureSetUrl = `${config.coreFrontUrl}/ipv/usefeatureset?featureSet=${featureSet}`;
    await page.goto(featureSetUrl);

    // The feature-set page renders a "Feature Set:" heading when successful
    await expect(page.locator("#header")).toContainText("Feature Set:", {
      timeout: 10000,
    });

    // Navigate back so the scenario can continue from where it was
    await page.goBack();
  },
);

/**
 * Asserts that the orchestrator stub is showing an error response page — i.e. the
 * journey ended with an error sent back to orchestration rather than a successful
 * identity outcome.
 *
 * Mirrors: @Then("The Error response sent to Orchestration") in OrchStubSteps.java
 * which checks the h3 heading reads "Something went wrong:".
 */
Then(
  "the error response is sent to orchestration",
  async ({ page }): Promise<void> => {
    // The orch stub error page renders an h3 with "Something went wrong:"
    await expect(page.locator("h3").first()).toContainText(
      "Something went wrong:",
      {
        timeout: 10000,
      },
    );
  },
);

/**
 * Asserts that the orch stub error page shows a specific OAuth error code and
 * human-readable error description.
 *
 * Mirrors: @Then("they should see error {string} and error_description {string}")
 * in OrchStubSteps.java which checks #error-code and #error-description.
 */
Then(
  "the error {string} with description {string} is shown",
  async ({ page }, error: string, errorDescription: string): Promise<void> => {
    await expect(page.locator("#error-code")).toContainText(error, {
      timeout: 10000,
    });
    await expect(page.locator("#error-description")).toContainText(
      errorDescription,
      { timeout: 10000 },
    );
  },
);

/**
 * Starts a second journey for the same user with the AIS re-approve identity
 * intervention configured, then kicks off a full journey route.
 *
 * Mirrors: @When("user starts a new full journey with the same userId with re-approve identity true")
 * in LoginSteps.java, which calls configureAisResponse("AIS_FORCED_USER_IDENTITY_VERIFY")
 * before starting a new journey with the same userId.
 */
When(
  "the user starts a reprove identity journey",
  async ({ orchStubUtils, scenarioContext }): Promise<void> => {
    const userId = scenarioContext.userId;
    if (!userId) {
      throw new Error("scenarioContext.userId is not set");
    }
    await configureAisIntervention(userId, "AIS_FORCED_USER_IDENTITY_VERIFY");
    // Re-use the same userId by re-starting the journey — orchStubUtils.startJourney
    // will fill in the existing userId from scenarioContext so it is preserved.
    await orchStubUtils.startJourney();
  },
);

/**
 * Asserts that the user has landed on the reprove-identity-start page (heading
 * "You need to prove your identity") and clicks Continue to proceed.
 *
 * Mirrors: @And("User lands on IPVCore reprove identity start page and presses continue")
 * in LoginSteps.java.
 */
When(
  "the user lands on the reprove identity start page and continues",
  async ({ page, pageUtils }): Promise<void> => {
    await pageUtils.expectPage("reprove-identity-start");
    await expect(page.locator("h1")).toContainText(
      "You need to prove your identity",
      {
        timeout: 10000,
      },
    );
    await pageUtils.getContinueButton().click();
  },
);

// NOTE: "the user continues to the RP after successfully proving their identity" is
// defined canonically in steps/ipv-page-steps/page-ipv-success.steps.ts using
// performPageAction. That definition is the single source of truth for this step.
