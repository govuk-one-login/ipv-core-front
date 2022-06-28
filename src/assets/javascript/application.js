/* global dataLayer */
"use strict";

// based on the code at
// https://github.com/alphagov/di-authentication-frontend/blob/main/src/assets/javascript/cookies.js

var cookies = function(trackingId, analyticsCookieDomain, journeyState) {
  var COOKIES_PREFERENCES_SET = "cookies_preferences_set";
  var cookiesAccepted = document.querySelector("#cookies-accepted");
  var cookiesRejected = document.querySelector("#cookies-rejected");
  var hideCookieBanner = document.querySelectorAll(".cookie-hide-button");
  var cookieBannerContainer = document.querySelector(".govuk-cookie-banner");
  var cookieBanner = document.querySelector("#cookies-banner-main");
  var acceptCookies = document.querySelector('button[name="cookiesAccept"]');
  var rejectCookies = document.querySelector('button[name="cookiesReject"]');

  function cookieBannerInit() {
    acceptCookies.addEventListener("click", function(event) {
      event.preventDefault();
      setBannerCookieConsent(true);
    }.bind(this));
    rejectCookies.addEventListener("click", function(event) {
      event.preventDefault();
      setBannerCookieConsent(false);
    }.bind(this));
    var hideButtons = Array.prototype.slice.call(hideCookieBanner);
    hideButtons.forEach(function(element) {
      element.addEventListener("click", function(event) {
        event.preventDefault();
        hideElement(cookieBannerContainer);
      }.bind(this));
    });
    var hasCookiesPolicy = getCookie(COOKIES_PREFERENCES_SET);
    if (!hasCookiesPolicy) {
      showElement(cookieBannerContainer);
    }
  }
  function setBannerCookieConsent(analyticsConsent) {
    setCookie(COOKIES_PREFERENCES_SET, {
      analytics: analyticsConsent
    }, {
      days: 365
    });
    hideElement(cookieBanner);
    if (analyticsConsent) {
      showElement(cookiesAccepted);
      initAnalytics();
    } else {
      showElement(cookiesRejected);
    }
  }
  function hasConsentForAnalytics() {
    var cookieConsent = JSON.parse(getCookie(COOKIES_PREFERENCES_SET));
    return cookieConsent ? cookieConsent.analytics : false;
  }
  function initAnalytics() {
    loadGtmScript();
    initGtm();
    initLinkerHandlers();
  }
  function loadGtmScript() {
    var gtmScriptTag = document.createElement("script");
    gtmScriptTag.type = "text/javascript";
    gtmScriptTag.setAttribute("async", "true");
    gtmScriptTag.setAttribute("src", "https://www.googletagmanager.com/gtm.js?id=" + trackingId);
    document.documentElement.firstChild.appendChild(gtmScriptTag);
  }
  function initGtm() {
    window.dataLayer = [ {
      "gtm.allowlist": [ "google" ],
      "gtm.blocklist": [ "adm", "awct", "sp", "gclidw", "gcs", "opt" ]
    }, {
      department: {
        programmeteam: "di",
        productteam: "core"
      }
    } ];
    var sessionJourney = getJourneyMapping(journeyState);
    function gtag(obj) {
      dataLayer.push(obj);
    }
    if (sessionJourney) {
      gtag(sessionJourney);
    }
    gtag({
      "gtm.start": new Date().getTime(),
      event: "gtm.js"
    });
  }
  function initLinkerHandlers() {
    //
    // Currently this is not required
    // but it will need to go back in when we want to track click events
    // but in a more extensible way
    //
    // SELECT any form with a #form-tracking attribute
    // var submitButton = document.querySelector('button[type="submit"]');
    // var pageForm = document.getElementById("form-tracking");
    //
    // THEN track clicks on the button
    // if (submitButton && pageForm) {
    //   submitButton.addEventListener("click", function() {
    //     if (window.ga && window.gaplugins) {
    //       var tracker = ga.getAll()[0];
    //       var linker = new window.gaplugins.Linker(tracker);
    //       var destinationLink = linker.decorate(pageForm.action);
    //       pageForm.action = destinationLink;
    //     }
    //   });
    // }
    //
    // Track any element (so only one) with #track-link
    // override the standard link behaviour
    //
    // var trackLink = document.getElementById("track-link");
    // if (trackLink) {
    //   trackLink.addEventListener("click", function(e) {
    //     e.preventDefault();
    //     if (window.ga && window.gaplugins) {
    //       var tracker = ga.getAll()[0];
    //       var linker = new window.gaplugins.Linker(tracker);
    //       var destinationLink = linker.decorate(trackLink.href);
    //       window.location.href = destinationLink;
    //     } else {
    //       window.location.href = trackLink.href;
    //     }
    //   });
    // }
  }
  function generateSessionJourney(journey, status) {
    return {
      sessionjourney: {
        journey: journey,
        status: status
      }
    };
  }
  function getJourneyMapping(journeyState) {
    // what is journeyState set to if a variable isn't passed?
    const JOURNEY_DATA_LAYER_PATHS = {
      // successful journey points
      "pageIpvIdentityStart": generateSessionJourney("journeyEvent", "pyi-start"),
      "pagePreKbvTransition": generateSessionJourney("journeyEvent", "kbv-start"),
      "pageIpvSuccess": generateSessionJourney("journeyEvent", "pyi-end"),
      // user-related KBV issues
      "pyiKbvFail": generateSessionJourney("journeyEvent", "kbv-fail"),
      "pyiNoMatch": generateSessionJourney("journeyEvent", "no-database-match"),
      // System errors
      "errors.pageNotFound": generateSessionJourney("journeyError", "page-not-found"),
      "pyiTechnical": generateSessionJourney("journeyError", "recoverable-technical-problem"),
      "errors.error": generateSessionJourney("journeyError", "technical-problem"),
      "pageIpvError": generateSessionJourney("journeyError", "unknown-error"), // fallback error

      // no pageID passed into the HTML
      "": generateSessionJourney("analyticsError","unknown-page-id")
    };
    return JOURNEY_DATA_LAYER_PATHS[journeyState];
  }
  function getCookie(name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(";");
    for (var i = 0, len = cookies.length; i < len; i++) {
      var cookie = cookies[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  }
  function setCookie(name, values, options) {
    if (typeof options === "undefined") {
      options = {};
    }
    var cookieString = name + "=" + JSON.stringify(values);
    if (options.days) {
      var date = new Date();
      date.setTime(date.getTime() + options.days * 24 * 60 * 60 * 1e3);
      cookieString = cookieString + "; expires=" + date.toGMTString() + "; path=/;" + " domain=" + analyticsCookieDomain + ";";
    }
    if (document.location.protocol === "https:") {
      cookieString = cookieString + "; Secure";
    }
    document.cookie = cookieString;
  }
  function hideElement(el) {
    el.style.display = "none";
  }
  function showElement(el) {
    el.style.display = "block";
  }
  return {
    cookieBannerInit: cookieBannerInit,
    hasConsentForAnalytics: hasConsentForAnalytics,
    initAnalytics: initAnalytics
  };
};

window.GOVSignIn = window.GOVSignIn || {};
window.GOVSignIn.Cookies = cookies;

(function(w) {
  "use strict";
  function appInit(trackingId, analyticsCookieDomain, journeyState) {
    window.GOVUKFrontend.initAll();
    var cookies = window.GOVSignIn.Cookies(trackingId, analyticsCookieDomain, journeyState);
    if (cookies.hasConsentForAnalytics()) {
      cookies.initAnalytics();
    }
    cookies.cookieBannerInit();
  }
  w.GOVSignIn.appInit = appInit;
})(window);
