export const pagesAndContexts: Record<string, (string | undefined)[]> = {
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
  "page-dcmaw-success": ["coiNoAddress", undefined],
  "page-face-to-face-handoff": [],
  "page-ipv-identity-document-start": [],
  "page-ipv-identity-document-types": [],
  "page-ipv-identity-postoffice-start": ["lastChoice", undefined],
  "page-ipv-pending": ["f2f-delete-details", undefined],
  "page-ipv-reuse": [],
  "page-ipv-success": ["repeatFraudCheck", "updateIdentity", undefined],
  "page-multiple-doc-check": ["nino", undefined],
  "page-pre-dwp-kbv-transition": [],
  "page-pre-experian-kbv-transition": [],
  "page-update-name": ["repeatFraudCheck", undefined],
  "page-different-security-questions": [],
  "personal-independence-payment": [],
  "photo-id-security-questions-find-another-way": ["dropout", undefined],
  "prove-identity-another-type-photo-id": ["drivingLicence", "passport"],
  "prove-identity-no-other-photo-id": ["drivingLicence", "passport"],
  "prove-identity-no-photo-id": ["nino", undefined],
  "pyi-another-way": [],
  "pyi-attempt-recovery": [],
  "pyi-confirm-delete-details": ["f2f", undefined],
  "pyi-continue-with-driving-licence": [],
  "pyi-continue-with-passport": [],
  "pyi-details-deleted": ["f2f", undefined],
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
  "sorry-could-not-confirm-details": [
    "deleteDetailsReuse",
    "existingIdentityValid",
    "existingIdentityInvalid",
    undefined,
  ],
  "update-details-failed": [
    "repeatFraudCheck",
    "existingIdentityInvalid",
    undefined,
  ],
  "update-details": [],
  "update-name-date-birth": [
    "repeatFraudCheck",
    "reuse",
    "rfcAccountDeletion",
    undefined,
  ],
  "uk-driving-licence-details-not-correct": [],
  "prove-identity-another-way": ["noF2f", undefined],
};
