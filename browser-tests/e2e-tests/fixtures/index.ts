import { test as baseTest } from "playwright-bdd";
import { pageUtils } from "./pages-fixture";
import { criStubUtils } from "./cri-stub-fixture";
import { orchestratorStubUtils } from "./orchestrator-stub-fixture";
import { TestInfo } from "playwright/test";
import { sanitiseUrl } from "../helpers/url-helpers";

export interface ScenarioContext {
  userId?: string;
  oauthState?: string;
}

interface Fixtures {
  scenarioContext: ScenarioContext;
  pageUtils: ReturnType<typeof pageUtils>;
  criStubUtils: ReturnType<typeof criStubUtils>;
  orchStubUtils: ReturnType<typeof orchestratorStubUtils>;
  capturePageDetailsOnFailure: void;
}

export default baseTest.extend<Fixtures>({
  scenarioContext: async ({}, use) => {
    await use({});
  },
  pageUtils: async ({ page }, use) => {
    await use(pageUtils(page));
  },
  criStubUtils: async ({ page, pageUtils }, use) => {
    await use(criStubUtils(page, pageUtils));
  },
  orchStubUtils: async ({ page, scenarioContext }, use, testInfo: TestInfo) => {
    await use(orchestratorStubUtils(page, scenarioContext, testInfo.title));
  },
  capturePageDetailsOnFailure: [
    async ({ page }, use, testInfo: TestInfo) => {
      // This waits for the test to complete so any code run after this is run once the test has finished
      // essentially acting as an afterEach hook (the scope for this fixture is set to "test")
      await use();

      if (testInfo.status !== testInfo.expectedStatus) {
        console.log(`Failure occurred at url: ${sanitiseUrl(page.url())}`);
        const screenshot = await page.screenshot();

        // Logging it might be helpful for when we're running this
        // in a CI/CD pipeline but for now, commenting it out since
        // it's noisy when running locally and the screenshot can
        // be viewed in the generate test report
        // const base64 = screenshot.toString("base64");
        // console.log(`\nScreenshot (base64):\n${base64}\n`);

        await testInfo.attach("screenshot-on-failure", {
          body: screenshot,
          contentType: "image/png",
        });
      }
    },
    { auto: true, scope: "test" },
  ],
});
