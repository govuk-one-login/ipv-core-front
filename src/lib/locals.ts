import { RequestHandler } from "express";
import config from "../config/config";
import { generateNonce } from "./strings";

export const setLocals: RequestHandler = async (req, res, next) => {
  res.locals.uaContainerId = config.GTM_ID;
  res.locals.ga4ContainerId = config.GTM_ID_GA4;
  res.locals.cspNonce = await generateNonce();
  res.locals.isGa4Enabled = config.GA4_DISABLED === "false";
  res.locals.analyticsDataSensitive =
    config.ANALYTICS_DATA_SENSITIVE === "true";
  res.locals.isUaEnabled = config.UA_DISABLED === "false";
  res.locals.dynatraceRumUrl = config.DT_RUM_URL;
  res.locals.analyticsCookieDomain = config.GTM_ANALYTICS_COOKIE_DOMAIN;
  res.locals.logoutUrl = config.LOGOUT_URL;
  res.locals.deleteAccountUrl = config.DELETE_ACCOUNT_URL;
  res.locals.deviceIntelligenceCookieDomain =
    config.DEVICE_INTELLIGENCE_COOKIE_DOMAIN;
  res.locals.enableProgressButtonTimeout = config.PROGRESS_SPINNER_BUTTON_TIMEOUT;

  const contactUsUrl = new URL(config.CONTACT_URL);
  contactUsUrl.searchParams.set(
    "fromUrl",
    `${config.SERVICE_URL}${req.originalUrl}`,
  );
  res.locals.contactUsUrl = contactUsUrl.href;

  // Patch the status code setter to make it available in locals as well
  const setStatusCode = res.status;
  res.status = function (code) {
    res.locals.statusCode = code;
    return setStatusCode.call(res, code);
  };

  next();
};
