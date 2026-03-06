import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";

const { Then } = createBdd(fixtures);

Then(
  "Alison Parker's information is displayed on the reuse screen",
  async ({ page }) => {
    await expect(page.getByText("ALISON JANE PARKER")).toBeVisible();
    await expect(page.getByText("80T")).toBeVisible();
    await expect(page.getByText("YEOMAN WAY")).toBeVisible();
    await expect(page.getByText("TROWBRIDGE")).toBeVisible();
    await expect(page.getByText("BA14")).toBeVisible();
    await expect(page.getByText("January 1970")).toBeVisible();
  },
);
