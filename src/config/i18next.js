const { SERVICE_DOMAIN } = require("../lib/config");

module.exports = {
  i18nextConfigurationOptions: function (path) {
    return {
      debug: false,
      fallbackLng: "en",
      preload: ["en"],
      supportedLngs: ["en", "cy"],
      backend: {
        loadPath: path,
        allowMultiLoading: true,
      },
      detection: {
        lookupCookie: "lng",
        lookupQuerystring: "lng",
        order: ["querystring", "cookie"],
        caches: ["cookie"],
        ignoreCase: true,
        cookieSecure: true,
        cookieDomain: SERVICE_DOMAIN,
        cookieSameSite: "",
      },
    };
  },
};
