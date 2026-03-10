import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";
import { PageUtils } from "../../fixtures/pages-fixture";

const { Given } = createBdd(fixtures);

export const selectResidenceLocation = async (
  pageUtils: PageUtils,
  fromUk: boolean,
): Promise<void> => {
  await performPageAction(
    { page: "live-in-uk", selectRadio: fromUk ? "uk" : "international" },
    { pageUtils },
  );
};

Given(
  /^the user is (not )?from the UK$/,
  async ({ pageUtils }, notFromUk?: string): Promise<void> => {
    await selectResidenceLocation(pageUtils, !notFromUk);
  },
);
