import { CONFIG } from "../config/test-config";
import { BddContext } from "../steps/bdd-context";
import { expect, Page } from "@playwright/test";

export const orchestratorStubUtils = (page: Page) => {
  const USER_ID_INPUT = "#userIdText";
  const ENV_SELECTOR = "#targetEnvironment";
  const FULL_JOURNEY_BUTTON = "#full-journey-button";

  const startJourney = async (env: string) => {
    await page.goto(CONFIG.URLS.ORCHESTRATOR_STUB);

    let userId = BddContext.get("userId");
    if (userId) {
      await page.locator(USER_ID_INPUT).fill(userId);
    } else {
      userId = await page.locator(USER_ID_INPUT).inputValue();
      BddContext.set("userId", userId);
    }

    expect(userId).toBeTruthy();

    await page.locator(ENV_SELECTOR).selectOption(env);
    await page.locator(FULL_JOURNEY_BUTTON).click();
  };

  const expectVot = async (expectedVot: string) => {};

  return {
    startJourney,
  };
};
