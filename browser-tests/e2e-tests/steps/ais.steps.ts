import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";
import { configureAisIntervention } from "../clients/ais-management-client";

const { Given, When } = createBdd(fixtures);

Given(
  "the AIS API will return an {string} result before the journey starts",
  async ({ orchStubUtils }, intervention: string): Promise<void> => {
    const userId = await orchStubUtils.prepareUserId();
    await configureAisIntervention(userId, intervention);
  },
);

/** Requires a started journey to provide the current user ID. */
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

When(
  "the user starts a reprove identity journey",
  async ({ orchStubUtils, scenarioContext }): Promise<void> => {
    const userId = scenarioContext.userId;
    if (!userId) {
      throw new Error("scenarioContext.userId is not set");
    }
    // startJourney reuses the existing user ID from scenarioContext.
    await orchStubUtils.startJourney();
  },
);
