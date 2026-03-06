import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { Given } = createBdd(fixtures);

Given(
  /^the user has a (passport|driving licence) for the web journey$/,
  async (
    { pageUtils },
    document: "passport" | "driving licence",
  ): Promise<void> => {
    await performPageAction(
      {
        page: "page-multiple-doc-check",
        selectRadio: document == "passport" ? "ukPassport" : "drivingLicence",
      },
      { pageUtils },
    );
  },
);
