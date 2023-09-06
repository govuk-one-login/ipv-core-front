/* global document window */

window.DI = window.DI || {};

(function(DI){

  'use strict'

  const cookies = {

    hasConsentForAnalytics: function () {
      const COOKIES_PREFERENCES_SET = "cookies_preferences_set";
      const cookieConsent = JSON.parse(
        decodeURIComponent(this.getCookie(COOKIES_PREFERENCES_SET))
      );
      return cookieConsent ? cookieConsent.analytics === true : false;
    },

    getCookie: function (name) {
      const nameEQ = name + '=';
      if (document.cookie) {
        const cookies = document.cookie.split(';');
        for (let i = 0, len = cookies.length; i < len; i++) {
          let cookie = cookies[i];
          while (cookie.startsWith(' ')) {
            cookie = cookie.substring(1, cookie.length);
          }
          if (cookie.startsWith(nameEQ)) {
            return cookie.substring(nameEQ.length);
          }
        }
      }
      return null;
    },

    setCookie: function (name, values, options, domain) {
      if (typeof options === "undefined") {
        options = {};
      }

      let cookieString = `${name}=${encodeURIComponent(JSON.stringify(values))}`;
      if (options.days) {
        const date = new Date();
        date.setTime(date.getTime() + options.days * 24 * 60 * 60 * 1000);
        cookieString = `${cookieString}; Expires=${date.toUTCString()}; Path=/; Domain=${domain}`;
      }

      if (document.location.protocol === "https:") {
        cookieString = `${cookieString}; Secure`;
      }

      document.cookie = cookieString;
    }
  }

  DI.cookies = cookies

})(window.DI)
