window.DI = window.DI || {};

(function (DI) {
  "use strict";

  const core = {

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
