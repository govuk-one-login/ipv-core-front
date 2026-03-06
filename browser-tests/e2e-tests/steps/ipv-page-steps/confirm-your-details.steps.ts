import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { toCamelCase } from "../../helpers/string-helpers";
import { performPageAction } from "../../helpers/page-action-helper";

const { When } = createBdd(fixtures);

When(
  /^the user chooses to update their ([\w ]+) when confirming their details$/,
  async ({ pageUtils }, fieldsToUpdate: string): Promise<void> => {
    const updates = fieldsToUpdate.split(/,\s*/).map((f) => f.trim());
    await performPageAction(
      {
        page: "confirm-your-details",
        action: async ({ pageUtils }): Promise<void> => {
          await pageUtils.selectRadio("no");
          await Promise.all(
            updates.map(async (field) => {
              await pageUtils.selectCheckbox(toCamelCase(field));
            }),
          );
          await pageUtils.getContinueButton().click();
        },
      },
      { pageUtils },
    );
  },
);
