const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

test("Snapshots", async ({ page }) => {

  test.setTimeout(120000)
  for (const pageName of Object.keys(pagesToTest)) {
    const contexts = pagesToTest[pageName];
    const contextsToTest = contexts.length > 0 ? contexts : [ undefined ];

    for (const context of contextsToTest) {
      for (const language of [ "en", "cy" ]) {
        var url = `http://localhost:4601/dev/template/${pageName}/${language}`;
        var screenshotContext = "";
        if (context !== undefined) {
          url += `?context=${context}`;
          screenshotContext = `-${context}`;
        }
        const screenshotFilename = `${pageName}-${language}${screenshotContext}.jpeg`;
        await page.goto(url);

        // Open all summaries on the page
        const allSummaries = await page.locator("summary").all();
        for (const summary of allSummaries) {
          await summary.click();
        }

        const actualScreenshot = await page.screenshot({fullPage: true, type: "jpeg", quality: 20});
        expect(actualScreenshot).toMatchSnapshot(screenshotFilename, {threshold: 0.25});
      }
    }
  }
});

test("All templates have snapshot tests", async () => {
  const directoryPath = path.join(__dirname, "/../../src/views/ipv/page");
  const missingTemplates = [];

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      throw err;
    }

    const testedTemplates = Object.keys(pagesToTest);

    for (const file of files) {
      const templateName = path.parse(file).name;
      if (!testedTemplates.find(tt => tt === templateName)) {
        missingTemplates.push(templateName);
      }
    }

    expect(missingTemplates).toStrictEqual([]);
  });
});

const pagesToTest = {
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
  "page-multiple-doc-check": ["f2f","nino",undefined],
  "page-pre-dwp-kbv-transition": [],
  "page-pre-experian-kbv-transition": [],
  "page-update-name": ["repeatFraudCheck",undefined],
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
  "pyi-triage-desktop-download-app": ["android", "iphone"],
  "pyi-triage-mobile-confirm": [],
  "pyi-triage-mobile-download-app": ["android", "iphone"],
  "pyi-triage-select-device": [],
  "pyi-triage-select-smartphone": [],
  "reprove-identity-start": [],
  "sorry-could-not-confirm-details": ["deleteDetailsReuse",undefined],
  "update-details-failed": ["repeatFraudCheck",undefined],
  "update-details": [],
  "update-name-date-birth": ["repeatFraudCheck","reuse","rfcAccountDeletion",undefined]
}
