import cfenv from "cfenv";
import dotenv from "dotenv";

dotenv.config();

const appEnv = cfenv.getAppEnv();
const coreBackApiUrl = appEnv.isLocal
  ? undefined
  : appEnv.getServiceURL("core-back-api");

export default {
  ANDROID_APP_ID: process.env.ANDROID_APP_ID ?? "uk.gov.documentchecking",
  API_BASE_URL:
    coreBackApiUrl ?? process.env.API_BASE_URL ?? "http://localhost:4502",
  API_CRI_CALLBACK: "/cri/callback",
  API_MOBILE_APP_CALLBACK: "/app/callback",
  API_JOURNEY_EVENT: "/journey",
  API_SESSION_INITIALISE: "/session/initialise",
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS: "/user/proven-identity-details",
  API_CHECK_MOBILE_APP_VC_RECEIPT: "/app/check-vc-receipt",
  API_APP_VC_RECEIPT_STATUS: "/app-vc-receipt-status",
  APP_STORE_URL_ANDROID:
    process.env.APP_STORE_URL_ANDROID ??
    "https://play.google.com/store/apps/details?id=uk.gov.documentchecking",
  APP_STORE_URL_APPLE:
    process.env.APP_STORE_URL_APPLE ??
    "https://apps.apple.com/gb/app/gov-uk-id-check/id1629050566",
  APPLE_APP_ID: process.env.APPLE_APP_ID ??
    "DEV_IOS_APP_ID",
  ENABLE_PREVIEW: process.env.ENABLE_PREVIEW === "development",
  EXTERNAL_WEBSITE_HOST: process.env.EXTERNAL_WEBSITE_HOST,
  PORT: process.env.PORT ?? 4501,
  SESSION_COOKIE_NAME: "ipv_core_service_session",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev_secret",
  SESSION_TABLE_NAME: process.env.SESSION_TABLE_NAME,
  GTM_ID: process.env.GTM_ID,
  GTM_ID_GA4: process.env.GTM_ID_GA4,
  GTM_ANALYTICS_COOKIE_DOMAIN: process.env.ANALYTICS_DOMAIN,
  GA4_DISABLED: process.env.GA4_DISABLED,
  UA_DISABLED: process.env.UA_DISABLED,
  DT_RUM_URL: process.env.DT_RUM_URL,
  CONTACT_URL:
    process.env.CONTACT_URL ??
    "https://home.build.account.gov.uk/contact-gov-uk-one-login",
  SERVICE_URL: process.env.SERVICE_URL,
  TEMPLATE_CACHING: process.env.TEMPLATE_CACHING,
  SERVICE_DOMAIN: process.env.SERVICE_DOMAIN ?? "localhost",
  LANGUAGE_TOGGLE_ENABLED: process.env.LANGUAGE_TOGGLE === "true",
  USE_DEVICE_INTELLIGENCE: process.env.USE_DEVICE_INTELLIGENCE === "true",
  LOGOUT_URL: process.env.LOGOUT_URL ?? "https://oidc.account.gov.uk/logout",
  DELETE_ACCOUNT_URL:
    process.env.DELETE_ACCOUNT_URL ??
    "https://home.build.account.gov.uk/enter-password?type=deleteAccount",
  SSM_PARAMETER_CACHE_TTL: process.env.SSM_PARAMETER_CACHE_TTL ?? "300000", // Cache duration in milliseconds (5 minutes)
  MAM_SPINNER_REQUEST_TIMEOUT:
    process.env.MAM_SPINNER_REQUEST_TIMEOUT || 600000,
  SPINNER_REQUEST_INTERVAL: process.env.SPINNER_REQUEST_INTERVAL || 3000,
  SPINNER_REQUEST_LONG_WAIT_INTERVAL:
    process.env.SPINNER_REQUEST_LONG_WAIT_INTERVAL || 60000,
  POST_OFFICE_VISIT_BY_DAYS: 15,
  DAD_SPINNER_REQUEST_TIMEOUT:
    process.env.DAD_SPINNER_REQUEST_TIMEOUT || 2400000,
};
