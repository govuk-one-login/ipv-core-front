import fs from "fs";
import i18next from "i18next";
import {configureNunjucks} from "../shared/config/nunjucks";

const buildServiceUnavailableHtml = (outputFile: string) => {
  const enJson = JSON.parse(fs.readFileSync("./locales/en/translation.json", 'utf-8'))
  const cyJson = JSON.parse(fs.readFileSync("./locales/cy/translation.json", 'utf-8'))

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
