/* global window document */

window.DI = window.DI || {}
window.DI.analyticsGa4 = window.DI.analyticsGa4 || {};

(function (analytics) {

  'use strict'

  // container is an optional parameter used for unit tests
  const init = function(container) {

    const consentGiven = window.DI.cookies.hasConsentForAnalytics()

    if (consentGiven) {
      window.DI.core.load(window.DI.analytics.vars.ga4ContainerId)

      initGa4GlobalTrackers()
      initGa4ElementTrackers(container ?? document)
    } else {
      window.addEventListener('cookie-consent', () => window.DI.analyticsGa4.init())
    }
  }

  // Initialise trackers for GA4 events which can be tracked at the global page level, such as page_view events
  const initGa4GlobalTrackers = function () {
    const trackers = window.DI.analyticsGa4.trackers
    for (const trackerName in trackers) {
      if (Object.hasOwn(trackers, trackerName)) {
        const tracker = trackers[trackerName]
        if (typeof tracker.init === 'function') {
          try {
            tracker.init()
          } catch (e) {
            // if there's a problem with the tracker, catch the error to allow other trackers to start
            /* eslint-disable-next-line no-console */
            console.warn('Error starting analytics tracker ' + tracker + ': ' + e.message, window.location)
          }
        }
      }
    }
  }

  const getTrackingElements = function (document) {
    const trackerSelector = '[ga4-trackers]'
    const trackingElementsNodes = document.querySelectorAll(trackerSelector)
    const trackingElements = []
    // convert nodelist of trackers to array
    for (const element of trackingElementsNodes) {
      trackingElements.push(element)
    }

    return trackingElements
  }

  // eg form-tracker to FormTracker
  const kebabCaseToPascalCase = function (string) {
    const camelCase = function (string) {
      return string.replace(/-([a-z])/g, function (g) {
        return g.charAt(1).toUpperCase()
      })
    }

    const capitaliseFirstLetter = function (string) {
      return string.charAt(0).toUpperCase() + string.slice(1)
    }

    return capitaliseFirstLetter(camelCase(string))
  }

  // Initialise trackers for GA4 events which should be tracked on specific page elements, such as form_response events
  const initGa4ElementTrackers = function (document) {

    const elements = getTrackingElements(document)

    for (const element of elements) {
      const elementTrackers = element.getAttribute('ga4-trackers').split(' ')

      for (const elementTracker of elementTrackers) {
        const trackerName = kebabCaseToPascalCase(elementTracker)
        const trackers = window.DI.analyticsGa4.trackers
        if (Object.hasOwn(trackers, trackerName)) {
          const tracker = trackers[trackerName]
          if (typeof tracker === 'function' && typeof tracker.prototype.init === 'function') {
            try {
              new tracker(element).init()
            } catch (e) {
              // if there's a problem with the tracker, catch the error to allow other trackers to start
              /* eslint-disable-next-line no-console */
              console.warn('Error starting element tracker ' + tracker + ': ' + e.message, window.location)
            }
          }
        }
      }
    }
  }

  analytics.init = init

})(window.DI.analyticsGa4)
