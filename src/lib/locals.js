const { GTM_ANALYTICS_COOKIE_DOMAIN, GTM_ID, RUM_ACTIVE, RUM_ID } = require("./config");
const { generateNonce } = require("./strings");

module.exports = {
  getGTM: function (req, res, next) {
    res.locals.scriptNonce = generateNonce();
    res.locals.gtmId = GTM_ID;
    res.locals.analyticsCookieDomain = GTM_ANALYTICS_COOKIE_DOMAIN;
    res.locals.rumActive = RUM_ACTIVE;
    res.locals.rumId = RUM_ID;
    next();
  },
};
