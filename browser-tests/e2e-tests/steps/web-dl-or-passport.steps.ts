import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import fixtures from "../fixtures";

const { Then } = createBdd(fixtures);

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
