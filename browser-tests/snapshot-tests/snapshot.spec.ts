import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import {
  iteratePagesAndContexts
} from "../data/pagesAndContexts";
import { pagesAndContexts } from "../../src/test-utils/pages-and-contexts";

test.describe.parallel("Snapshot tests", () => {
  test.setTimeout(120000);
  iteratePagesAndContexts(
    (pageName, context, language, url) => {
      test(`Snapshot test for ${pageName}, context ${context} and language ${language}`, async ({ page }) => {
        let screenshotContext = "";
        if (context !== undefined) {
          screenshotContext = `-${context}`;
        }
        const screenshotFilename = `${pageName}-${language}${screenshotContext}.jpeg`;
        await page.goto(url);

        // Open all summaries on the page
        const allSummaries = await page.locator("details summary").all();
        for (const summary of allSummaries) {
          await summary.click();
        }

        // Make sure that all the summary details are visible
        const allSummaryDetails = await page.locator("details div").all();
        for (const details of allSummaryDetails) {
          await details.waitFor();
        }

        const actualScreenshot = await page.screenshot({fullPage: true, type: "jpeg", quality: 20});
        expect(actualScreenshot).toMatchSnapshot(screenshotFilename, {threshold: 0.25,  maxDiffPixels: 2});
      });
    }
  );

  test("All templates have snapshot tests", async () => {
    const directoryPath = path.join(__dirname, "/../../views/ipv/page");
    const missingTemplates: string[] = [];

    fs.readdir(directoryPath, function (err, files) {
      if (err) {
        throw err;
      }

      const testedTemplates = Object.keys(pagesAndContexts);

      for (const file of files) {
        const templateName = path.parse(file).name;
        if (!testedTemplates.find(tt => tt === templateName)) {
          missingTemplates.push(templateName);
        }
      }

      expect(missingTemplates).toStrictEqual([]);
    });
  });
});
