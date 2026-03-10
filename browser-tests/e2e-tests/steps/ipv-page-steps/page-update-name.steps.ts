import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { When } = createBdd(fixtures);

When(
  "the user has valid photo ID to update their name with the app",
  async ({ pageUtils }): Promise<void> => {
    await performPageAction(
      {
        page: "page-update-name",
        selectRadio: "update-name",
      },
      { pageUtils },
    );
  },
);
