window.DI = window.DI || {};

(function (DI) {
  "use strict";

  const core = {
    load: function (containerId) {
      const gtmScriptTag = document.createElement("script");
      gtmScriptTag.type = "text/javascript";
      gtmScriptTag.setAttribute("async", "true");
      gtmScriptTag.setAttribute(
        "src",
        "https://www.googletagmanager.com/gtm.js?id=" + containerId,
      );
      gtmScriptTag.setAttribute("crossorigin", "anonymous");
      document.documentElement.firstChild.appendChild(gtmScriptTag);
    },

    sendData: function (data) {
      window.dataLayer = window.dataLayer ?? [];
      window.dataLayer.push(data);
    },

    trackerFunctions: {
      findTrackingAttributes: function (clicked, trackingTrigger) {
        if (clicked.hasAttribute("[" + trackingTrigger + "]")) {
          return clicked;
        } else {
          return clicked.closest("[" + trackingTrigger + "]");
        }
      },
    },
  };

  DI.core = core;
})(window.DI);
