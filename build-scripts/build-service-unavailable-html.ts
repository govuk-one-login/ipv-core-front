import {readFile, writeFile} from "fs/promises";
import i18next from "i18next";
import { configureNunjucks } from "../src/config/nunjucks";
import {
  frontendUiTranslationEn,
  setBaseTranslations,
  setFrontendUiTranslations
} from "@govuk-one-login/frontend-ui";

const PROD_CONTACT_US_URL = "https://home.account.gov.uk/contact-gov-uk-one-login";
const PROD_LOGOUT_URL = "https://oidc.account.gov.uk/logout"

const buildServiceUnavailableHtml = async (outputFile: string) => {
  const applicationCss = await readFile("./dist/public/stylesheets/application.css");

  await i18next.init();

  setBaseTranslations(i18next);
  setFrontendUiTranslations(i18next);

  const nunjucksEnv = configureNunjucks();

  // Required by the frontend-ui components, override values from configureNunjucks()
  nunjucksEnv.addGlobal("basePath", __dirname + "/..");
  // As this page is static it must match the production branding.
  nunjucksEnv.addGlobal("MAY_2025_REBRAND_ENABLED", true);

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
    applicationCss,
    translations: {
      translation: {
        header: frontendUiTranslationEn.header,
        cookieBanner: frontendUiTranslationEn.cookieBanner,
        phaseBanner: frontendUiTranslationEn.phaseBanner,
        footer: frontendUiTranslationEn.footer
      }
    },
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
