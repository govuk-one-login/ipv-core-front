require("dotenv").config();

const cfenv = require("cfenv");
const appEnv = cfenv.getAppEnv();
const serviceConfig = {};

if (!appEnv.isLocal) {
  serviceConfig.coreBackAPIUrl = appEnv.getServiceURL("core-back-api");
}

module.exports = {
  API_BASE_URL: serviceConfig.coreBackAPIUrl || process.env.API_BASE_URL,
  CREDENTIAL_ISSUER_BASE_URL: process.env.CREDENTIAL_ISSUER_BASE_URL,
  AUTH_PATH: "/authorize",
  API_REQUEST_EVIDENCE_PATH: "/request-evidence",
  API_REQUEST_CONFIG_PATH: "/request-config",
  CREDENTIAL_ISSUER_AUTH_PATH: "/authorize",
  CREDENTIAL_ISSUER_ID: "PassportIssuer",
  DCS_CREDENTIAL_ISSUER_BASE_URL: process.env.DCS_CREDENTIAL_ISSUER_BASE_URL,
  DCS_CREDENTIAL_ISSUER_AUTH_PATH: "/oauth2/authorize",
  DCS_CREDENTIAL_ISSUER_ID: "DcsPassportIssuer",
  EXTERNAL_WEBSITE_HOST: process.env.EXTERNAL_WEBSITE_HOST,
  PORT: process.env.PORT || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET,
};
