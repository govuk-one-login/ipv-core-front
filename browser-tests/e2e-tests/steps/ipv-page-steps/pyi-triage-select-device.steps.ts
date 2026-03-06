import { createBdd } from "playwright-bdd";
import fixtures from "../../fixtures";
import { performPageAction } from "../../helpers/page-action-helper";
import { PageUtils } from "../../fixtures/pages-fixture";

const { Given } = createBdd(fixtures);

export const selectDevice = async (
  pageUtils: PageUtils,
  device: "computer-or-tablet" | "smartphone",
): Promise<void> => {
  await performPageAction(
    {
      page: "pyi-triage-select-device",
      selectRadio: device,
    },
    { pageUtils },
  );
};

Given(
  /^the user is on a (computer or tablet|smartphone)$/,
  async (
    { pageUtils },
    device: "computer or tablet" | "smartphone",
  ): Promise<void> => {
    await selectDevice(
      pageUtils,
      device.replaceAll(" ", "-") as "computer-or-tablet" | "smartphone",
    );
  },
);
