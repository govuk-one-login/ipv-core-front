import { test as baseTest } from "playwright-bdd";
import { pageUtils } from "./pages-fixture";
import { criStubUtils } from "./cri-stub-fixture";
import { orchestratorStubUtils } from "./orchestrator-stub-fixture";

export interface ScenarioContext {
  userId?: string;
  oauthState?: string;
}

interface Fixtures {
  scenarioContext: ScenarioContext;
  pageUtils: ReturnType<typeof pageUtils>;
  criStubUtils: ReturnType<typeof criStubUtils>;
  orchStubUtils: ReturnType<typeof orchestratorStubUtils>;
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
  orchStubUtils: async ({ page, scenarioContext }, use) => {
    await use(orchestratorStubUtils(page, scenarioContext));
  },
});
