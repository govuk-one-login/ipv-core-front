import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { Given } = createBdd(fixtures);

Given(
  "the user re-attempts identity proving via the post office",
  async ({ pageUtils }): Promise<void> => {
    await performPageAction(
      {
        page: "pyi-post-office",
        selectRadio: "next",
      },
      { pageUtils },
    );
  },
);
