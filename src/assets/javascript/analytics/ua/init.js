window.DI2 = window.DI2 || {};
window.DI2.analyticsUa = window.DI2.analyticsUa || {};

(function (analytics) {
  "use strict";

  function initGtm() {
    const sendData = window.DI2.core.sendData;

    sendData({
      "gtm.allowlist": ["google"],
      "gtm.blocklist": ["adm", "awct", "sp", "gclidw", "gcs", "opt"],
    });

    sendData({
      event: "progEvent",
      ProgrammeName: "DI - PYI",
    });

    if (window.DI2.journeyState) {
      sendData({
        event: "journeyEvent",
        JourneyStatus: window.DI2.journeyState,
      });
    }

    const languageCode = document.querySelector("html")?.getAttribute("lang");
    const languageNames = {
      en: "english",
      cy: "welsh",
    };

    sendData({
      event: "langEvent",
      language: languageNames[languageCode],
      languagecode: languageCode,
    });

    sendData({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });
  }

  const init = function () {
    const consentGiven = window.DI2.cookies.hasConsentForAnalytics();

    if (consentGiven) {
      window.DI2.core.load(window.DI2.analytics.vars.uaContainerId);
      initGtm();
    } else {
      window.addEventListener("cookie-consent", window.DI2.analyticsUa.init);
    }
  };

  analytics.init = init;
})(window.DI2.analyticsUa);
