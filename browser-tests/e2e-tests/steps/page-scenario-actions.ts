import { Pages } from "../../../src/test-utils/pages-and-contexts";
import { PageUtils } from "../fixtures/pages-fixture";
import { expect } from "@playwright/test";

/**
 * Central registry for all page radio-select-and-continue interactions.
 *
 * Instead of creating a new step definition for a page with radio buttons,
 * add an entry here. The generic step `the user {string}` will handle it.
 *
 * See: steps/page-interactions.steps.ts
 */
export const pageScenarioActions = {
  /**
   * "live-in-uk" actions
   */
  "is from the UK": { page: "live-in-uk", radioValue: "uk" },
  "is not from the UK": { page: "live-in-uk", radioValue: "international" },

  /**
   * "page-ipv-identity-document-start" actions
   */
  "has valid photo ID for the app": {
    page: "page-ipv-identity-document-start",
    radioValue: "appTriage",
  },
  "does not have valid photo ID for the app": {
    page: "page-ipv-identity-document-start",
    radioValue: "end",
  },

  /**
   * "pyi-triage-select-device" actions
   */
  "is on a computer or tablet": {
    page: "pyi-triage-select-device",
    radioValue: "computer-or-tablet",
  },
  "is on a smartphone": {
    page: "pyi-triage-select-device",
    radioValue: "smartphone",
  },

  /**
   * "pyi-triage-select-smartphone" actions
   */
  "has an android": {
    page: "pyi-triage-select-smartphone",
    radioValue: "android",
  },
  "has an iphone": {
    page: "pyi-triage-select-smartphone",
    radioValue: "iphone",
  },
  "does not have an appropriate device for the app": {
    page: "pyi-triage-select-smartphone",
    radioValue: "neither",
  },

  /**
   * "pyi-triage-buffer" actions
   */
  "needs another way to prove their identity from the app": {
    page: "pyi-triage-buffer",
    radioValue: "anotherWay",
  },

  /**
   * "check-mobile-app-result" actions
   */
  "successfully receives credentials after returning to the app": {
    page: "check-mobile-app-result",
    action: async ({ pageUtils }): Promise<void> => {
      const continueButton = pageUtils.getContinueButton();
      await expect(continueButton).toBeEnabled({ timeout: 15 * 1000 });
      await continueButton.click();
    },
  },

  /**
   * "page-dcmaw-success" actions
   */
  "acknowledges they have successfully completed the app": {
    page: "page-dcmaw-success",
  },

  /**
   * "page-ipv-success" actions
   */
  "continues to the RP after successfully proving their identity": {
    page: "page-ipv-success",
  },

  /**
   * "page-multiple-doc-check" actions
   */
  "has a passport for the web journey": {
    page: "page-multiple-doc-check",
    radioValue: "ukPassport",
  },

  /**
   * "personal-independence-payment" actions
   */
  "does not get PIP": {
    page: "personal-independence-payment",
    radioValue: "end",
  },

  /**
   * "page-pre-experian-kbv-transition" actions
   */
  "moves on to answer security questions with Experian KBV": {
    page: "page-pre-experian-kbv-transition",
  },

  /**
   * "confirm-your-details" actions
   */
  "chooses to update their given names when confirming their details": {
    page: "confirm-your-details",
    action: async ({ pageUtils }): Promise<void> => {
      await pageUtils.selectRadio("no");
      await pageUtils.selectCheckbox("givenNames");
      await pageUtils.getContinueButton().click();
    },
  },

  /**
   * "page-update-name" actions
   */
  "has valid photo ID to update their name with the app": {
    page: "page-update-name",
    radioValue: "update-name",
  },

  /**
   * "page-ipv-identity-postoffice-start" actions
   */
  "has valid photo ID for the Post Office": {
    page: "page-ipv-identity-postoffice-start",
    radioValue: "next",
  },

  /**
   * "photo-id-security-questions-find-another-way" actions
   */
  "re-attempts identity proving with the app": {
    page: "photo-id-security-questions-find-another-way",
    radioValue: "appTriage",
  },

  /**
   * "pyi-post-office" actions
   */
  "re-attempts identity proving via the post office": {
    page: "pyi-post-office",
    radioValue: "next",
  },

} satisfies Record<string, PageActions>;

export interface PageActions {
  page: Pages;
  radioValue?: string;
  action?: ({ pageUtils }: { pageUtils: PageUtils }) => Promise<void>;
}
