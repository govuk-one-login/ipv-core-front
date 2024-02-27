window.DI2 = window.DI2 || {};
window.DI2.analyticsGa4 = window.DI2.analyticsGa4 || {};
window.DI2.analyticsGa4.trackers = window.DI2.analyticsGa4.trackers || {};

(function (trackers) {
  "use strict";

  let PageViewTracker = {
    init: function () {
      const data = {
        event: "page_view_ga4",
        page_view: {
          language: this.getLanguage(),
          location: this.getLocation(),
          organisations: "<OT1056>",
          primary_publishing_organisation:
            "government digital service - digital identity",
          status_code: this.getStatusCode(),
          title: this.getTitle(),
          referrer: this.getReferrer(),
          taxonomy_level1: "web cri",
          taxonomy_level2: "pre cri",
        },
      };
      window.DI2.core.sendData(data);
    },

    getLanguage: function () {
      return document.querySelector("html")?.getAttribute("lang");
    },

    getStatusCode: function () {
      return window.DI2.httpStatusCode ?? 200;
    },

    getLocation: function () {
      return document.location.href?.toLowerCase();
    },

    getTitle: function () {
      return document.title?.toLowerCase();
    },

    getReferrer: function () {
      return document.referrer?.toLowerCase();
    },
  };

  trackers.PageViewTracker = PageViewTracker;
})(window.DI2.analyticsGa4.trackers);
