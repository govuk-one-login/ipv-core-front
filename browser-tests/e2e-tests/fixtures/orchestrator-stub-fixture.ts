import config from "../config";
import { expect, Page } from "@playwright/test";
import { ScenarioContext } from "./index";

export const orchestratorStubUtils = (
  page: Page,
  scenarioContext: ScenarioContext,
) => {
  const USER_ID_INPUT = "#userIdText";
  const ENV_SELECTOR = "#targetEnvironment";
  const FULL_JOURNEY_BUTTON = "#full-journey-button";

  const startJourney = async (env: string) => {
    await page.goto(config.orchestratorStubUrl);

    let userId = scenarioContext.userId;
    if (userId) {
      await page.locator(USER_ID_INPUT).fill(userId);
    } else {
      userId = await page.locator(USER_ID_INPUT).inputValue();
      scenarioContext.userId = userId;
    }

    expect(userId).toBeTruthy();

    await page.locator(ENV_SELECTOR).selectOption(env);
    await page.locator(FULL_JOURNEY_BUTTON).click();
  };

  const expectVot = async (expectedVot: string) => {
    await page
      .locator("summary")
      .filter({ hasText: "Raw User Info Object" })
      .click();

    await expect(page.locator(".govuk-details__text").first()).toContainText(
      `"${expectedVot}"`,
      {
        timeout: 10000,
      },
    );
  };

  return {
    startJourney,
    expectVot,
  };
};
