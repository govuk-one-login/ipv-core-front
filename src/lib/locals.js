const { GTM_ANALYTICS_COOKIE_DOMAIN, GTM_ID, RUM_ID } = require("./config");
const { generateNonce } = require("./strings");

module.exports = {
  getGTM: function (req, res, next) {
    res.locals.gtmId = GTM_ID;
    res.locals.RUM_ID = RUM_ID;
    res.locals.scriptNonce = generateNonce();
    res.locals.analyticsCookieDomain = GTM_ANALYTICS_COOKIE_DOMAIN;
    next();
  },
};
