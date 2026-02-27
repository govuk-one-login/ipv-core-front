import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { testFixtures } from "../fixtures/fixtures";
import { BddContext } from "./bdd-context";

const { When, Then } = createBdd(testFixtures);

When(
  "the user starts a new journey in {string}",
  async ({ orchestratorPage }, env: string) => {
    await orchestratorPage.navigate();

    let userId = BddContext.get("userId");
    if (userId) {
      await orchestratorPage.setUserId(userId);
    } else {
      userId = await orchestratorPage.getUserId();
      BddContext.set("userId", userId);
    }

    expect(userId).toBeTruthy();

    await orchestratorPage.selectEnvironment(env);
    await orchestratorPage.startFullJourney();
  },
);

Then(
  "Kenneth Decerqueira's information is displayed on the reuse screen",
  async ({ page }) => {
    await expect(page.getByText("KENNETH DECERQUEIRA")).toBeVisible();
    await expect(page.getByText("8, HADLEY ROAD")).toBeVisible();
    await expect(page.getByText("BATH")).toBeVisible();
    await expect(page.getByText("BA2 5AA")).toBeVisible();
    await expect(page.getByText("8 July 1965")).toBeVisible();
  },
);
