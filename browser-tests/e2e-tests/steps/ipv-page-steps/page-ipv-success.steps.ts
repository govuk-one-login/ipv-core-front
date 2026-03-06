import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { Given } = createBdd(fixtures);

Given(
  "the user continues to the RP after successfully proving their identity",
  async ({ pageUtils }): Promise<void> => {
    await performPageAction(
      {
        page: "page-ipv-success",
      },
      { pageUtils },
    );
  },
);
