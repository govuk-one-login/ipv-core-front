import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { Given } = createBdd(fixtures);

Given(
  "the user moves on to answer security questions with Experian KBV",
  async ({ pageUtils }): Promise<void> => {
    await performPageAction(
      {
        page: "page-pre-experian-kbv-transition",
      },
      { pageUtils },
    );
  },
);
