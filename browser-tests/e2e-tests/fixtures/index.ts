import { test as baseTest } from "playwright-bdd";
import { pageUtils, PageUtils } from "./pages-fixture";
import { criStubUtils, CriStubUtils } from "./cri-stub-fixture";
import {
  orchestratorStubUtils,
  OrchestratorStubUtils,
} from "./orchestrator-stub-fixture";
import { TestInfo } from "playwright/test";
import { sanitiseUrl } from "../helpers/url-helpers";

export interface ScenarioContext {
  userId?: string;
  oauthState?: string;
}

interface Fixtures {
  scenarioContext: ScenarioContext;
  pageUtils: PageUtils;
  criStubUtils: CriStubUtils;
  orchStubUtils: OrchestratorStubUtils;
  capturePageDetailsOnFailure: void;
}

export default baseTest.extend<Fixtures>({
  scenarioContext: async ({}, use): Promise<void> => {
    await use({});
  },
  pageUtils: async ({ page }, use): Promise<void> => {
    await use(pageUtils(page));
  },
  criStubUtils: async ({ page, pageUtils }, use): Promise<void> => {
    await use(criStubUtils(page, pageUtils));
  },
  orchStubUtils: async (
    { page, scenarioContext },
    use,
    testInfo: TestInfo,
  ): Promise<void> => {
    await use(orchestratorStubUtils(page, scenarioContext, testInfo.title));
  },
  capturePageDetailsOnFailure: [
    async ({ page }, use, testInfo: TestInfo): Promise<void> => {
      // This waits for the test to complete so any code run after this is run once the test has finished
      // essentially acting as an afterEach hook (the scope for this fixture is set to "test")
      await use();

      if (testInfo.status !== testInfo.expectedStatus) {
        console.info(`Failure occurred at url: ${sanitiseUrl(page.url())}`);
        const screenshot = await page.screenshot();

        // Logging it might be helpful for when we're running this
        // in a CI/CD pipeline but for now, commenting it out since
        // it's noisy when running locally and the screenshot can
        // be viewed in the generate test report
        // const base64 = screenshot.toString("base64");
        // console.info(`\nScreenshot (base64):\n${base64}\n`);

        await testInfo.attach("screenshot-on-failure", {
          body: screenshot,
          contentType: "image/png",
        });
      }
    },
    { auto: true, scope: "test" },
  ],
});
