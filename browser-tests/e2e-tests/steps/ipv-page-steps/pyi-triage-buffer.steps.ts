import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { Given } = createBdd(fixtures);

Given(
  "the user needs another way to prove their identity from the app",
  async ({ pageUtils }): Promise<void> => {
    await performPageAction(
      {
        page: "pyi-triage-buffer",
        selectRadio: "anotherWay",
      },
      { pageUtils },
    );
  },
);
