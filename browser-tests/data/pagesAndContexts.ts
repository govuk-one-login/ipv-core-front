export const pagesToTest: Record<string, (string | undefined)[]> = {
  "check-mobile-app-result": [],
  "confirm-your-details": [],
  "delete-handover": [],
  "find-another-way-access-service": [],
  "live-in-uk": [],
  "no-photo-id-abandon-find-another-way": [],
  "no-photo-id-exit-find-another-way": [],
  "no-photo-id-security-questions-find-another-way": ["dropout", undefined],
  "non-uk-no-app-options": [],
  "non-uk-app-intro": [],
  "non-uk-no-app": [],
  "non-uk-no-passport": [],
  "non-uk-passport": [],
  "page-dcmaw-success": ["coiNoAddress"],
  "page-face-to-face-handoff": [],
  "page-ipv-identity-document-start": [],
  "page-ipv-identity-document-types": [],
  "page-ipv-identity-postoffice-start": ["lastChoice", undefined],
  "page-ipv-pending": ["f2f-delete-details", undefined],
  "page-ipv-reuse": [],
  "page-ipv-success": ["repeatFraudCheck", "updateIdentity", undefined],
  "page-multiple-doc-check": ["nino",undefined],
  "page-pre-dwp-kbv-transition": [],
  "page-pre-experian-kbv-transition": [],
  "page-update-name": ["repeatFraudCheck",undefined],
  "page-different-security-questions": [],
  "personal-independence-payment": [],
  "prove-identity-another-type-photo-id": ["drivingLicence", "passport"],
  "prove-identity-no-other-photo-id": ["drivingLicence", "passport"],
  "prove-identity-no-photo-id": ["nino",undefined],
  "pyi-another-way": [],
  "pyi-attempt-recovery": [],
  "pyi-confirm-delete-details": ["f2f",undefined],
  "pyi-continue-with-driving-licence": [],
  "pyi-continue-with-passport": [],
  "pyi-cri-escape-no-f2f": [],
  "pyi-cri-escape": [],
  "pyi-details-deleted": ["f2f",undefined],
  "pyi-driving-licence-no-match-another-way": [],
  "pyi-driving-licence-no-match": [],
  "pyi-escape": [],
  "pyi-f2f-delete-details": [],
  "pyi-f2f-technical": [],
  "pyi-new-details": [],
  "pyi-no-match": ["bankAccount", "nino", undefined],
  "pyi-passport-no-match-another-way": [],
  "pyi-passport-no-match": [],
  "pyi-post-office": [],
  "pyi-suggest-other-options-no-f2f": [],
  "pyi-suggest-other-options": [],
  "pyi-technical": [],
  "pyi-timeout-recoverable": [],
  "pyi-timeout-unrecoverable": [],
  "pyi-triage-buffer": [],
  "pyi-triage-desktop-download-app": ["android", "iphone"],
  "pyi-triage-mobile-confirm": ["android", "iphone"],
  "pyi-triage-mobile-download-app": ["android", "iphone"],
  "pyi-triage-select-device": [],
  "pyi-triage-select-smartphone": ["mam", "dad"],
  "reprove-identity-start": [],
  "sorry-could-not-confirm-details": ["deleteDetailsReuse","existingIdentityValid","existingIdentityInvalid",undefined],
  "update-details-failed": ["repeatFraudCheck","existingIdentityInvalid",undefined],
  "update-details": [],
  "update-name-date-birth": ["repeatFraudCheck","reuse","rfcAccountDeletion",undefined],
  "uk-driving-licence-details-not-correct": [],
  "prove-identity-another-way": ["noF2f", undefined],
};

type TestFn = (pageName: string, context: string | undefined, language: string, url: string) => void;

export const iteratePagesAndContexts = (test: TestFn): void => {
  for (const pageName of Object.keys(pagesToTest)) {
    const contexts = pagesToTest[pageName];
    const contextsToTest = contexts.length > 0 ? contexts : [ undefined ];

    for (const context of contextsToTest) {
      for (const language of [ "en", "cy" ]) {
        let url = `${process.env.WEBSITE_HOST}/dev/template/${pageName}/${language}?pageErrorState=true`
        if (context !== undefined) {
          url += `&context=${context}`;
        }
        test(pageName, context, language, url);
      }
    }
  }
};
