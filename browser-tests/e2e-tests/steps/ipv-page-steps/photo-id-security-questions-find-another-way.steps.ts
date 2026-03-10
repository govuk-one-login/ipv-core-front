import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { Given } = createBdd(fixtures);

Given(
  "the user re-attempts identity proving with the app",
  async ({ pageUtils }): Promise<void> => {
    await performPageAction(
      {
        page: "photo-id-security-questions-find-another-way",
        selectRadio: "appTriage",
      },
      { pageUtils },
    );
  },
);
