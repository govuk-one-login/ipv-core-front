const {
  GTM_ANALYTICS_COOKIE_DOMAIN,
  GTM_ID,
  CDN_DOMAIN,
  CDN_PATH,
} = require("./config");
const { generateNonce } = require("./strings");

module.exports = {
  getGTM: function (req, res, next) {
    res.locals.gtmId = GTM_ID;
    res.locals.scriptNonce = generateNonce();
    res.locals.analyticsCookieDomain = GTM_ANALYTICS_COOKIE_DOMAIN;
    res.locals.assetsCdnPath = CDN_PATH;
    res.locals.assetPath = CDN_DOMAIN + "/assets";
    next();
  },
};
