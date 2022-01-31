require("dotenv").config();

const cfenv = require("cfenv");
const appEnv = cfenv.getAppEnv();
const serviceConfig = {};

if (!appEnv.isLocal) {
  serviceConfig.coreBackAPIUrl = appEnv.getServiceURL("core-back-api");
}

module.exports = {
  API_BASE_URL: serviceConfig.coreBackAPIUrl || process.env.API_BASE_URL,
  API_ISSUED_CREDENTIALS_PATH: "/issued-credentials",
  API_SHARED_ATTRIBUTES_JWT_PATH: "/shared-attributes",
  API_REQUEST_CONFIG_PATH: "/request-config",
  API_REQUEST_EVIDENCE_PATH: "/request-evidence",
  AUTH_PATH: "/authorize",
  EXTERNAL_WEBSITE_HOST: process.env.EXTERNAL_WEBSITE_HOST,
  PORT: process.env.PORT || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SHARED_ATTRIBUTES_JWT_SIZE_LIMIT: process.env.SHARED_ATTRIBUTES_JWT_SIZE_LIMIT || 6000,
};
