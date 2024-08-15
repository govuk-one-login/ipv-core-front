const {
  GTM_ANALYTICS_COOKIE_DOMAIN,
  GTM_ID,
  GTM_ID_GA4,
  CONTACT_URL,
  SERVICE_URL,
  UA_DISABLED,
  GA4_DISABLED,
  DT_RUM_URL,
  LOGOUT_URL,
  DELETE_ACCOUNT_URL,
} = require("./config");
const { generateNonce } = require("./strings");

module.exports = {
  setLocals: function (req, res, next) {
    res.locals.uaContainerId = GTM_ID;
    res.locals.ga4ContainerId = GTM_ID_GA4;
    res.locals.cspNonce = generateNonce();
    res.locals.isGa4Disabled = GA4_DISABLED;
    res.locals.isUaDisabled = UA_DISABLED;
    res.locals.dynatraceRumUrl = DT_RUM_URL;
    res.locals.analyticsCookieDomain = GTM_ANALYTICS_COOKIE_DOMAIN;
    res.locals.logoutUrl = LOGOUT_URL;

    const contactUsUrl = new URL(CONTACT_URL);
    contactUsUrl.searchParams.set(
      "fromUrl",
      `${SERVICE_URL}${req.originalUrl}`,
    );
    res.locals.contactUsUrl = contactUsUrl.href;

    res.locals.deleteAccountUrl = DELETE_ACCOUNT_URL;

    // Patch the status code setter to make it available in locals as well
    const setStatusCode = res.status;
    res.status = function (code) {
      res.locals.statusCode = code;
      return setStatusCode.call(res, code);
    };

    next();
  },
};
