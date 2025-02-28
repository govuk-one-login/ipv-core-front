import fs from "fs";
import i18next from "i18next";
import {configureNunjucks} from "../shared/config/nunjucks";
import enJson from "../locales/en/translation.json";
import cyJson from "../locales/cy/translation.json";

const buildServiceUnavailableHtml = (outputFile: string) => {
  i18next.init({
    resources: {
      en: {
        translation: enJson
      },
      cy: {
        translation: cyJson
      }
    }
  })

  const nunjucksEnv = configureNunjucks();

  const renderOptions: Record<string, unknown> = {
    cache: true,
    currentLanguage: "en",
    language: "en",
    i18n: {
      language: "en"
    },
    showLanguageToggle: false
  }

  const renderedHtml = nunjucksEnv.render("errors/service-unavailable.njk", renderOptions);
  fs.writeFile(outputFile, renderedHtml, (err) => { if (err) {throw err;}});
}

const htmlDestPath = process.argv[2];
buildServiceUnavailableHtml(htmlDestPath);
