import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { Given } = createBdd(fixtures);

Given(
  "the user acknowledges they have successfully completed the app",
  async ({ pageUtils }): Promise<void> => {
    await performPageAction(
      {
        page: "page-dcmaw-success",
      },
      { pageUtils },
    );
  },
);
