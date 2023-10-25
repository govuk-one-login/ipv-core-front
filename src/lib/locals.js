const {
  GTM_ANALYTICS_COOKIE_DOMAIN,
  GTM_ID,
  GTM_ID_GA4,
  CDN_DOMAIN,
  CDN_PATH,
  CONTACT_URL,
  SERVICE_URL,
} = require("./config");
const { generateNonce } = require("./strings");

module.exports = {
  setLocals: function (req, res, next) {
    res.locals.uaContainerId = GTM_ID;
    res.locals.ga4ContainerId = GTM_ID_GA4;
    res.locals.cspNonce = generateNonce();
    res.locals.analyticsCookieDomain = GTM_ANALYTICS_COOKIE_DOMAIN;
    res.locals.assetsCdnPath = CDN_PATH;
    res.locals.assetPath = CDN_DOMAIN + "/assets";
    res.locals.contactUsUrl = `${CONTACT_URL}?fromURL=${SERVICE_URL}${req.originalUrl}`;
    // Patch the status code setter to make it available in locals as well
    const setStatusCode = res.status;
    res.status = function (code) {
      res.locals.statusCode = code;
      return setStatusCode.call(res, code);
    };

    next();
  },
};
