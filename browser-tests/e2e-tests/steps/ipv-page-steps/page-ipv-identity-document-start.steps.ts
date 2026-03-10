import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";
import { PageUtils } from "../../fixtures/pages-fixture";

const { Given } = createBdd(fixtures);

export const selectPhotoIdAvailability = async (
  pageUtils: PageUtils,
  hasValidPhotoId: boolean,
): Promise<void> => {
  await performPageAction(
    {
      page: "page-ipv-identity-document-start",
      selectRadio: hasValidPhotoId ? "appTriage" : "end",
    },
    { pageUtils },
  );
};

Given(
  /^the user (doesn't have|has) valid photo ID for the app$/,
  async (
    { pageUtils },
    validPhotoId: "doesn't have" | "has",
  ): Promise<void> => {
    await selectPhotoIdAvailability(pageUtils, validPhotoId === "has");
  },
);
