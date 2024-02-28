window.DI = window.DI || {};
window.DI.analyticsUa = window.DI.analyticsUa || {};

(function (analytics) {
  "use strict";

  function initGtm() {
    const sendData = window.DI.analyticsGa4.pageViewTracker.pushToDataLayer;

    sendData({
      "gtm.allowlist": ["google"],
      "gtm.blocklist": ["adm", "awct", "sp", "gclidw", "gcs", "opt"],
    });

    sendData({
      event: "progEvent",
      ProgrammeName: "DI - PYI",
    });

    if (window.DI.journeyState) {
      sendData({
        event: "journeyEvent",
        JourneyStatus: window.DI.journeyState,
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
    const consentGiven = window.DI.analyticsGa4.cookie.hasConsentForAnalytics();

    if (consentGiven) {
      window.DI.analyticsGa4.loadGtmScript(
        window.DI.analyticsGa4.uaContainerId,
      );
      initGtm();
    } else {
      window.addEventListener("cookie-consent", window.DI.analyticsUa.init);
    }
  };

  analytics.init = init;
})(window.DI.analyticsUa);
