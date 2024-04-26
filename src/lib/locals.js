const {
  GTM_ANALYTICS_COOKIE_DOMAIN,
  GTM_ID,
  GTM_ID_GA4,
  CDN_DOMAIN,
  CDN_PATH,
  CONTACT_URL,
  SERVICE_URL,
  UA_DISABLED,
  GA4_DISABLED,
} = require("./config");
const { generateNonce } = require("./strings");

module.exports = {
  setLocals: function (req, res, next) {
    res.locals.uaContainerId = GTM_ID;
    res.locals.ga4ContainerId = GTM_ID_GA4;
    res.locals.cspNonce = generateNonce();
    res.locals.isGa4Disabled = GA4_DISABLED;
    res.locals.isUaDisabled = UA_DISABLED;
    res.locals.analyticsCookieDomain = GTM_ANALYTICS_COOKIE_DOMAIN;
    res.locals.assetsCdnPath = CDN_PATH;
    res.locals.assetPath = CDN_DOMAIN + "/assets";

    const contactUsUrl = new URL(CONTACT_URL);
    contactUsUrl.searchParams.set(
      "fromUrl",
      `${SERVICE_URL}${req.originalUrl}`,
    );
    res.locals.contactUsUrl = contactUsUrl.href;

    // Patch the status code setter to make it available in locals as well
    const setStatusCode = res.status;
    res.status = function (code) {
      res.locals.statusCode = code;
      return setStatusCode.call(res, code);
    };

    next();
  },
};
