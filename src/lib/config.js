require("dotenv").config();

const cfenv = require("cfenv");
const appEnv = cfenv.getAppEnv();
const serviceConfig = {};

if (!appEnv.isLocal) {
  serviceConfig.coreBackAPIUrl = appEnv.getServiceURL("core-back-api");
}

module.exports = {
  API_BASE_URL: serviceConfig.coreBackAPIUrl || process.env.API_BASE_URL,
  API_CRI_CALLBACK: "/cri/callback",
  API_SESSION_INITIALISE: "/session/initialise",
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS: "/user/proven-identity-details",
  APP_STORE_URL_ANDROID:
    process.env.APP_STORE_URL_ANDROID ||
    "https://play.google.com/store/apps/details?id=uk.gov.documentchecking",
  APP_STORE_URL_APPLE:
    process.env.APP_STORE_URL_APPLE ||
    "https://apps.apple.com/gb/app/gov-uk-id-check/id1629050566",
  ENABLE_PREVIEW: process.env.ENABLE_PREVIEW === "development",
  EXTERNAL_WEBSITE_HOST: process.env.EXTERNAL_WEBSITE_HOST,
  PORT: process.env.PORT || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_TABLE_NAME: process.env.SESSION_TABLE_NAME,
  GTM_ID: process.env.GTM_ID,
  GTM_ID_GA4: process.env.GTM_ID_GA4,
  GTM_ANALYTICS_COOKIE_DOMAIN: process.env.ANALYTICS_DOMAIN,
  GA4_DISABLED: process.env.GA4_DISABLED,
  UA_DISABLED: process.env.UA_DISABLED,
  CDN_PATH: process.env.CDN_PATH,
  CDN_DOMAIN: process.env.CDN_DOMAIN,
  CONTACT_URL: process.env.CONTACT_URL,
  SERVICE_URL: process.env.SERVICE_URL,
  TEMPLATE_CACHING: process.env.TEMPLATE_CACHING,
  SERVICE_DOMAIN: process.env.SERVICE_DOMAIN || "localhost",
};
