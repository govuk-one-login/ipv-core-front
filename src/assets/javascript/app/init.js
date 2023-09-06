window.DI = window.DI || {};

(function (DI) {
  "use strict";

  function appInit({ analyticsCookieDomain, uaContainerId, ga4ContainerId }) {
    window.DI.cookieBannerInit(analyticsCookieDomain);
    window.DI.loadAnalytics(uaContainerId, ga4ContainerId);
  }

  DI.appInit = appInit;
})(window.DI);
