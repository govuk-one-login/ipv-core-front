import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";
import { configureAisIntervention } from "../clients/ais-management-client";

const { Given, When } = createBdd(fixtures);

/**
 * Configures the AIS (Account Intervention Service) stub to return a specific
 * intervention result for the current user. Must be called after the journey has
 * started so that scenarioContext.userId is populated.
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
 * Starts a second journey for the same user, preserving the existing user ID.
 */
When(
  "the user starts a reprove identity journey",
  async ({ orchStubUtils, scenarioContext }): Promise<void> => {
    const userId = scenarioContext.userId;
    if (!userId) {
      throw new Error("scenarioContext.userId is not set");
    }
    // Re-use the same userId by re-starting the journey — orchStubUtils.startJourney
    // will fill in the existing userId from scenarioContext so it is preserved.
    await orchStubUtils.startJourney();
  },
);

// NOTE: "the user continues to the RP after successfully proving their identity" is
// defined canonically in steps/ipv-page-steps/page-ipv-success.steps.ts using
// performPageAction. That definition is the single source of truth for this step.
