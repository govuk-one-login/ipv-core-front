import {readFile, writeFile} from "fs/promises";
import i18next from "i18next";
import {configureNunjucks} from "../src/config/nunjucks";

const PROD_CONTACT_US_URL = "https://home.account.gov.uk/contact-gov-uk-one-login";
const PROD_LOGOUT_URL = "https://oidc.account.gov.uk/logout"

const buildServiceUnavailableHtml = async (outputFile: string) => {
  const enJson = JSON.parse(await readFile("./locales/en/translation.json", 'utf-8'));
  const cyJson = JSON.parse(await readFile("./locales/cy/translation.json", 'utf-8'));
  const applicationCss = await readFile("./dist/public/stylesheets/application.css");

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
    contactUsUrl: PROD_CONTACT_US_URL,
    logoutUrl: PROD_LOGOUT_URL,
    language: "en",
    i18n: {
      language: "en"
    },
    showLanguageToggle: false,
    useDeviceIntelligence: false,
    applicationCss
  }

  const renderedHtml = nunjucksEnv.render("errors/service-unavailable.njk", renderOptions);
  await writeFile(outputFile, renderedHtml);
}

( async() => {
  try {
    const htmlDestPath = process.argv[2];
    await buildServiceUnavailableHtml(htmlDestPath);
  } catch (e) {
    console.log("Error creating service-unavailable html");
    throw e;
  }
})();
