import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import dotenv from "dotenv";

dotenv.config();

// Call defineBddConfig to register BDD configuration
defineBddConfig({
  features: "e2e-tests/features/**/*.feature",
  steps: ["e2e-tests/steps/**/*.ts", "e2e-tests/fixtures/**/*.ts"],
});

// Export Playwright configuration for BDD tests
export default defineConfig({
  testDir: "./.features-gen",
  workers: 6,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
      },
    },
  ],
  timeout: 90 * 1000,
  use: {
    baseURL: process.env?.WEBSITE_HOST || "http://localhost:4601",
    headless: true,
  },
  expect: {
    timeout: 40 * 1000,
  },
});
