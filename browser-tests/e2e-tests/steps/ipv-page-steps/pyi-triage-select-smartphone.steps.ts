import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";
import { PageUtils } from "../../fixtures/pages-fixture";

const { Given } = createBdd(fixtures);

export const selectSmartphone = async (
  pageUtils: PageUtils,
  smartphone: "iphone" | "android" | "neither",
): Promise<void> => {
  await performPageAction(
    {
      page: "pyi-triage-select-smartphone",
      selectRadio: smartphone,
    },
    { pageUtils },
  );
};

Given(
  /^the user has an (iphone|android)$/,
  async ({ pageUtils }, smartphone: "iphone" | "android"): Promise<void> => {
    await selectSmartphone(pageUtils, smartphone);
  },
);

Given(
  "the user does not have an appropriate device for the app",
  async ({ pageUtils }): Promise<void> => {
    await selectSmartphone(pageUtils, "neither");
  },
);
