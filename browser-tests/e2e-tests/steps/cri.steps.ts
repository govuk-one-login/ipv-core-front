import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";

const { When } = createBdd(fixtures);

When(
  /^the user submits '([\w-]+)' '([\w-]+)' details to the CRI( with a '([\w-]+)' CI)?$/,
  async ({ criStubUtils }, scenario: string, cri: string, ci?: string) => {
    await criStubUtils.submitDetailsToCriStub(scenario, cri, ci);
  },
);

When(
  /^the user submits '([\w-]+)' '([\w-]+)' details to the CRI to mitigate the '([\w-]+)' CI$/,
  async (
    { criStubUtils },
    scenario: string,
    cri: string,
    mitigatedCi: string,
  ) => {
    await criStubUtils.submitDetailsToCriStub(
      scenario,
      cri,
      undefined,
      mitigatedCi,
    );
  },
);
