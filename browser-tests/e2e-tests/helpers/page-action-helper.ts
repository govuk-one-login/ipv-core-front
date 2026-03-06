import { PageName } from "../../../src/test-utils/pages-and-contexts";
import { PageUtils } from "../fixtures/pages-fixture";

interface PageAction {
  page: PageName;
  selectRadio?: string;
  action?: ({ pageUtils }: { pageUtils: PageUtils }) => Promise<void>;
}

/**
 * Executes a page interaction by asserting the expected page, then performing
 * the configured action — a custom action, a radio select-and-continue, or
 * a simple continue button click.
 *
 * This should be used by all IPV page step definitions to ensure consistent
 * page assertions before any interaction.
 */
export const performPageAction = async (
  pageAction: PageAction,
  { pageUtils }: { pageUtils: PageUtils },
): Promise<void> => {
  await pageUtils.expectPage(pageAction.page);

  if (pageAction.action) {
    await pageAction.action({ pageUtils });
  } else if (pageAction.selectRadio) {
    await pageUtils.selectRadioAndContinue(pageAction.selectRadio);
  } else {
    await pageUtils.getContinueButton().click();
  }
};
