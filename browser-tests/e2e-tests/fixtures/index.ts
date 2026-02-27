import { test as baseTest } from "playwright-bdd";
import { ApiService } from "../services/api-service";
import { DcmawAsyncService } from "../services/dcmaw-async-service";
import { pageUtils } from "./pages-fixture";
import { criStubUtils } from "./cri-stub-fixture";
import { orchestratorStubUtils } from "./orchestrator-stub-fixture";

type Fixtures = {
  apiService: ApiService;
  dcmawAsyncService: DcmawAsyncService;
  scenarioContext: Map<string, any>;
  pageUtils: ReturnType<typeof pageUtils>;
  criStubUtils: ReturnType<typeof criStubUtils>;
  orchStubUtils: ReturnType<typeof orchestratorStubUtils>;
};

export default baseTest.extend<Fixtures>({
  apiService: async ({ request }, use) => {
    await use(new ApiService(request));
  },
  dcmawAsyncService: async ({ request }, use) => {
    await use(new DcmawAsyncService(request));
  },
  scenarioContext: async ({}, use) => {
    await use(new Map<string, any>());
  },
  pageUtils: async ({ page }, use) => {
    await use(pageUtils(page));
  },
  criStubUtils: async ({ page, pageUtils }, use) => {
    await use(criStubUtils(page, pageUtils));
  },
  orchStubUtils: async ({ page }, use) => {
    await use(orchestratorStubUtils(page));
  },
});
