import { defineConfig, devices } from "@playwright/test";
import { cucumberReporter, defineBddConfig } from "playwright-bdd";

// Call defineBddConfig to register BDD configuration
defineBddConfig({
  features: "e2e-tests/features/**/*.feature",
  steps: ["e2e-tests/steps/**/*.ts", "e2e-tests/fixtures/**/*.ts"],
});

// In CI (pipelines) run headless with no slowdown.
// Locally, run headed with a 1-second delay between actions so journeys are
// easy to follow in the browser.
const isCI = Boolean(process.env.CI);
const headless = isCI;
const slowMo = isCI ? 0 : 1000;

// Export Playwright configuration for BDD tests
const testReportDirectory = process.env.TEST_REPORT_ABSOLUTE_DIR || "reports";
const testArtifactsDirectory =
  process.env.TEST_ARTIFACTS_ABSOLUTE_DIR || "e2e-tests/test-results";

export default defineConfig({
  testDir: "./.features-gen",
  retries: 1,
  reporter: [
    cucumberReporter("json", { outputFile: `${testReportDirectory}/e2e.json` }),
    ["html", { open: "never", outputFolder: testArtifactsDirectory }],
  ],
  workers: 3,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless,
        slowMo,
      },
    },
  ],
  timeout: 90 * 1000,
  use: {
    baseURL: process.env?.WEBSITE_HOST || "http://localhost:4601",
    headless,
    slowMo,
  },
  expect: {
    timeout: 40 * 1000,
  },
});
