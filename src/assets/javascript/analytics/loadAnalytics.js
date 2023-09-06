window.DI = window.DI || {};
window.DI.analytics = window.DI.analytics || {};
window.DI.analytics.vars = window.DI.analytics.vars || {};

(function (DI) {
  "use strict";

  function isValid(containerId) {
    return typeof containerId === "string" && containerId.startsWith("GTM-");
  }

  function loadUa(uaContainerId) {
    if (!isValid(uaContainerId)) {
      /* eslint-disable-next-line no-console */
      console.warn(
        `UA analytics will not be initialised: uaContainerId is ${uaContainerId}`
      );
      return;
    }
    window.DI.analytics.vars.uaContainerId = uaContainerId;
    window.DI.analyticsUa.init();
  }

  function loadGa4(ga4ContainerId) {
    if (!isValid(ga4ContainerId)) {
      /* eslint-disable-next-line no-console */
      console.warn(
        `GA4 analytics will not be initialised: ga4ContainerId is ${ga4ContainerId}`
      );
      return;
    }
    window.DI.analytics.vars.ga4ContainerId = ga4ContainerId;
    window.DI.analyticsGa4.init();
  }

  function loadAnalytics(uaContainerId, ga4ContainerId) {
    loadUa(uaContainerId);
    loadGa4(ga4ContainerId);
  }

  DI.loadAnalytics = loadAnalytics;
})(window.DI);
