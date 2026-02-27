import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import fixtures from "../fixtures";

const { When, Then } = createBdd(fixtures);

When(
  "the user starts a new journey in {string}",
  async ({ orchStubUtils }, env: string) => {
    await orchStubUtils.startJourney(env);
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
