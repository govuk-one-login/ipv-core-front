import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { Given } = createBdd(fixtures);

Given(
  "the user has valid photo ID for the Post Office",
  async ({ pageUtils }): Promise<void> => {
    await performPageAction(
      {
        page: "page-ipv-identity-postoffice-start",
        selectRadio: "next",
      },
      { pageUtils },
    );
  },
);
