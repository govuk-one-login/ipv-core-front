require("dotenv").config();

const cfenv = require("cfenv");
const appEnv = cfenv.getAppEnv();
const serviceConfig = {};

// We need to limit this dev/debug page to development environments
const ENABLE_ALL_TEMPLATES_PAGE =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "local";

if (!appEnv.isLocal) {
  serviceConfig.coreBackAPIUrl = appEnv.getServiceURL("core-back-api");
}

function getServiceDomain() {
  return process.env.SERVICE_DOMAIN || "localhost";
}

module.exports = {
  API_BASE_URL: serviceConfig.coreBackAPIUrl || process.env.API_BASE_URL,
  API_CRI_CALLBACK: "/journey/cri/callback",
  API_SESSION_INITIALISE: "/session/initialise",
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS: "/user/proven-identity-details",
  ENABLE_ALL_TEMPLATES_PAGE: ENABLE_ALL_TEMPLATES_PAGE,
  EXTERNAL_WEBSITE_HOST: process.env.EXTERNAL_WEBSITE_HOST,
  PORT: process.env.PORT || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_TABLE_NAME: process.env.SESSION_TABLE_NAME,
  GTM_ID: process.env.GTM_ID,
  GTM_ID_GA4: process.env.GTM_ID_GA4,
  GTM_ANALYTICS_COOKIE_DOMAIN: process.env.ANALYTICS_DOMAIN,
  CDN_PATH: process.env.CDN_PATH,
  CDN_DOMAIN: process.env.CDN_DOMAIN,
  CONTACT_URL: process.env.CONTACT_URL,
  HOST_URL: process.env.HOST_URL,
  getServiceDomain,
};
