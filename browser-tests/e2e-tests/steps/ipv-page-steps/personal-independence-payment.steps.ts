import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";

const { Given } = createBdd(fixtures);

Given(
  /^the user does (not )?get PIP$/,
  async ({ pageUtils }, noPip?: string): Promise<void> => {
    await performPageAction(
      {
        page: "personal-independence-payment",
        selectRadio: noPip ? "end" : "next",
      },
      { pageUtils },
    );
  },
);
