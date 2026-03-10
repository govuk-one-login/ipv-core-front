import { createBdd } from "playwright-bdd";
import fixtures from "../fixtures";
import { enqueueVcWithScenario } from "../clients/dcmaw-async-client";
import { selectResidenceLocation } from "./ipv-page-steps/live-in-uk.steps";
import { selectPhotoIdAvailability } from "./ipv-page-steps/page-ipv-identity-document-start.steps";
import { selectDevice } from "./ipv-page-steps/pyi-triage-select-device.steps";
import { selectSmartphone } from "./ipv-page-steps/pyi-triage-select-smartphone.steps";

const { Given } = createBdd(fixtures);

Given(
  "the user completes an initial P2 identity journey with expired Alice Parker details",
  async ({ pageUtils, criStubUtils, scenarioContext }) => {
    await selectResidenceLocation(pageUtils, true);
    await selectPhotoIdAvailability(pageUtils, true);
    await selectDevice(pageUtils, "computer-or-tablet");
    await selectSmartphone(pageUtils, "iphone");

    const userId = scenarioContext.userId;
    if (!userId) {
      throw new Error("Missing userId");
    }
    scenarioContext.oauthState = await enqueueVcWithScenario(
      userId,
      "alice-parker-valid",
      "successful",
    );

    await pageUtils.waitForContinueButtonToBeEnabledThenContinue(15);

    await criStubUtils.submitDetailsToCriStub(
      "alice-parker-valid",
      "driving-licence",
    );
    // On page-dcmaw-success
    await pageUtils.getContinueButton().click();

    await criStubUtils.submitDetailsToCriStub("alice-parker-valid", "address");

    await criStubUtils.submitDetailsToCriStub(
      "alice-parker-expired-fraud",
      "fraud",
    );
  },
);
