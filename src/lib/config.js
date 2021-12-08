require("dotenv").config();

const cfenv = require("cfenv");
const appEnv = cfenv.getAppEnv();
const serviceConfig = {};

if (!appEnv.isLocal) {
  serviceConfig.coreBackAPIUrl = appEnv.getServiceURL("core-back-api");
}

module.exports = {
  API_BASE_URL: serviceConfig.coreBackAPIUrl || process.env.API_BASE_URL,
  AUTH_PATH: "/authorize",
  API_REQUEST_EVIDENCE_PATH: "/request-evidence",
  BASE_URL: process.env.BASE_URL,
  CREDENTIAL_ISSUER_BASE_URL: process.env.CREDENTIAL_ISSUER_BASE_URL,
  CREDENTIAL_ISSUER_AUTH_PATH: "/authorize",
  CREDENTIAL_ISSUER_ID: "PassportIssuer",
  PORT: process.env.PORT || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET,
};
