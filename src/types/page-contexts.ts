import { IpvPageName } from "../constants/ipv-pages";

type PageContextMap = {
  "delete-handover": { journeyType: string };
  "need-more-information-confirm-change-details": { journeyType: string };
  "no-photo-id-security-questions-find-another-way": { reason: string };
  "page-dcmaw-success": { noAddress: boolean };
  "page-ipv-pending": { allowDeleteDetails: boolean };
  "page-ipv-success": { journeyType: string };
  "page-multiple-doc-check": { allowNino: boolean };
  "page-update-name": { journeyType: string };
  "photo-id-security-questions-find-another-way": { reason: string };
  "prove-identity-another-type-photo-id": { invalidDoc: string };
  "retry-prove-identity-app": { returningUser: boolean };
  "prove-identity-another-way": { removeF2f: boolean };
  "prove-identity-no-other-photo-id": { invalidDoc: string };
  "prove-identity-no-photo-id": { ninoOnly: boolean };
  "pyi-details-deleted": { journeyType: string };
  "pyi-no-match": { reason: string };
  "pyi-technical": { isUnrecoverable: boolean };
  "pyi-triage-desktop-download-app": {
    smartphone: "android" | "iphone";
    isAppOnly: boolean;
  };
  "pyi-triage-mobile-download-app": {
    smartphone: "android" | "iphone";
    isAppOnly: boolean;
  };
  "pyi-triage-select-smartphone": { deviceType: "mam" | "dad" };
  "sorry-could-not-confirm-details": { isExistingIdentityValid: boolean };
  "sorry-technical-problem": { reason: string };
  "uk-driving-licence-details-not-correct": { isFromStrategicApp: boolean };
  "update-details-failed": { isExistingIdentityInvalid: boolean };
  "update-name-date-birth": { journeyType: string };
};

type IpvPagesWithContexts = keyof PageContextMap & IpvPageName;

export type PageContextFor<T extends IpvPageName> =
  T extends IpvPagesWithContexts ? PageContextMap[T] : never;

export const getTypedPageContext = <T extends IpvPagesWithContexts>(
  _page: T,
  pageContext: Record<string, unknown> | undefined,
): PageContextFor<T> | undefined => {
  return pageContext as PageContextFor<T> | undefined;
};
