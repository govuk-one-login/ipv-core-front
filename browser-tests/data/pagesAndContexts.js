const pagesToTest = {
  "check-mobile-app-result": [],
  "confirm-your-details": [],
  "delete-handover": [],
  "find-another-way-access-service": [],
  "no-photo-id-abandon-find-another-way": [],
  "no-photo-id-exit-find-another-way": [],
  "no-photo-id-security-questions-find-another-way": ["dropout", undefined],
  "page-dcmaw-success": ["coiNoAddress"],
  "page-face-to-face-handoff": [],
  "page-ipv-identity-document-start": [],
  "page-ipv-identity-document-types": [],
  "page-ipv-identity-postoffice-start": ["lastChoice", undefined],
  "page-ipv-pending": ["f2f-delete-details", undefined],
  "page-ipv-reuse": [],
  "page-ipv-success": ["repeatFraudCheck", undefined],
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
  "sorry-could-not-confirm-details": ["deleteDetailsReuse",undefined],
  "update-details-failed": ["repeatFraudCheck",undefined],
  "update-details": [],
  "update-name-date-birth": ["repeatFraudCheck","reuse","rfcAccountDeletion",undefined]
}

function iteratePagesAndContexts(test) {
  for (const pageName of Object.keys(pagesToTest)) {
    const contexts = pagesToTest[pageName];
    const contextsToTest = contexts.length > 0 ? contexts : [ undefined ];

    for (const context of contextsToTest) {
      for (const language of [ "en", "cy" ]) {
        let url = `${process.env.WEBSITE_HOST}/dev/template/${pageName}/${language}`
        if (context !== undefined) {
          url += `?context=${context}`;
        }
        test(pageName, context, language, url);
      }
    }
  }
}

module.exports = {
  pagesToTest,
  iteratePagesAndContexts
}
