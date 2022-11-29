const sanitize = require("sanitize-filename");

const {
  API_BASE_URL,
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
} = require("../../lib/config");
const {
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
} = require("../shared/criHelper");

const { generateAxiosConfig, getAxios } = require("../shared/axiosHelper");
const {
  logError,
  logCoreBackCall,
  transformError,
} = require("../shared/loggerHelper");
const {
  LOG_COMMUNICATION_TYPE_REQUEST,
  LOG_TYPE_JOURNEY,
  LOG_COMMUNICATION_TYPE_RESPONSE,
  LOG_TYPE_CRI,
  LOG_TYPE_CLIENT,
  LOG_TYPE_PAGE,
} = require("../shared/loggerConstants");
const { generateHTMLofAddress } = require("../shared/addressHelper");
const { samplePersistedUserDetails } = require("../shared/debugJourneyHelper");

async function journeyApi(action, req) {
  if (action.startsWith("/")) {
    action = action.substr(1);
  }

  logCoreBackCall(req, {
    logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
    type: LOG_TYPE_JOURNEY,
    path: action,
  });

  return getAxios(req).post(
    `${API_BASE_URL}/${action}`,
    {},
    generateAxiosConfig(req)
  );
}

async function handleJourneyResponse(req, res, action) {
  const backendResponse = (await journeyApi(action, req)).data;
  return await handleBackendResponse(req, res, backendResponse);
}

async function handleBackendResponse(req, res, backendResponse) {
  if (backendResponse?.journey) {
    logCoreBackCall(req, {
      logCommunicationType: LOG_COMMUNICATION_TYPE_RESPONSE,
      type: LOG_TYPE_JOURNEY,
      path: backendResponse.journey,
    });
    return await handleJourneyResponse(req, res, backendResponse.journey);
  }

  if (backendResponse?.cri && tryValidateCriResponse(backendResponse.cri)) {
    logCoreBackCall(req, {
      logCommunicationType: LOG_COMMUNICATION_TYPE_RESPONSE,
      type: LOG_TYPE_CRI,
      path: req.cri,
    });
    req.cri = backendResponse.cri;
    req.session.currentPage = req.cri.id;
    await buildCredentialIssuerRedirectURL(req, res);
    return redirectToAuthorize(req, res);
  }

  if (
    backendResponse?.client &&
    tryValidateClientResponse(backendResponse.client)
  ) {
    logCoreBackCall(req, {
      logCommunicationType: LOG_COMMUNICATION_TYPE_RESPONSE,
      type: LOG_TYPE_CLIENT,
      path: backendResponse.client,
    });

    req.session.currentPage = "orchestrator";
    const { redirectUrl } = backendResponse.client;
    return res.redirect(redirectUrl);
  }

  if (backendResponse?.page) {
    logCoreBackCall(req, {
      logCommunicationType: LOG_COMMUNICATION_TYPE_RESPONSE,
      type: LOG_TYPE_PAGE,
      path: backendResponse.page,
      requestId: req.requestId,
    });
    req.session.currentPage = backendResponse.page;
    return res.redirect(`/ipv/page/${backendResponse.page}`);
  }
}

function tryValidateCriResponse(criResponse) {
  if (!criResponse?.redirectUrl) {
    throw new Error(`CRI response RedirectUrl is missing`);
  }

  return true;
}

function tryValidateClientResponse(client) {
  const { redirectUrl } = client;

  if (!redirectUrl) {
    throw new Error(`Client Response redirect url is missing`);
  }

  return true;
}

module.exports = {
  updateJourneyState: async (req, res, next) => {
    //routine to be removed once debug journey rewrite is complete
    try {
      if (!req.session.isDebugJourney) {
        return next(new Error("Debug operation not available"));
      }

      const allowedActions = [
        "/journey/next",
        "/journey/error",
        "/journey/fail",
        "/journey/cri/build-oauth-request/ukPassport",
        "/journey/cri/build-oauth-request/stubUkPassport",
        "/journey/cri/build-oauth-request/fraud",
        "/journey/cri/build-oauth-request/stubFraud",
        "/journey/cri/build-oauth-request/address",
        "/journey/cri/build-oauth-request/stubAddress",
        "/journey/cri/build-oauth-request/kbv",
        "/journey/cri/build-oauth-request/stubKbv",
        "/journey/cri/build-oauth-request/activityHistory",
        "/journey/cri/build-oauth-request/stubActivityHistory",
        "/journey/cri/build-oauth-request/dcmaw",
        "/journey/cri/build-oauth-request/stubDcmaw",
        "/journey/cri/build-oauth-request/debugAddress",
        "/journey/build-client-oauth-response",
        "/journey/cri/validate/ukPassport",
        "/journey/cri/validate/stubUkPassport",
        "/journey/cri/validate/fraud",
        "/journey/cri/validate/stubFraud",
        "/journey/cri/validate/address",
        "/journey/cri/validate/stubAddress",
        "/journey/cri/validate/kbv",
        "/journey/cri/validate/stubKbv",
        "/journey/cri/validate/dcmaw",
        "/journey/cri/validate/stubDcmaw",
        "/journey/end-mitigation-journey/MJ01",
        "/journey/end-mitigation-journey/MJ02",
        "/journey/build-proven-user-identity-details",
      ];

      const action = allowedActions.find((x) => x === req.url);

      if (action) {
        await handleJourneyResponse(req, res, action);
      } else {
        next(new Error(`Action ${req.url} not valid`));
      }
    } catch (error) {
      next(error);
    }
  },
  handleJourneyPage: async (req, res, next) => {
    try {
      const { pageId } = req.params;
      if (!req.session.isDebugJourney && req.session.currentPage !== pageId) {
        logError(
          req,
          {
            pageId: pageId,
            expectedPage: req.session.currentPage,
          },
          "page :pageId doesn't match expected session page :expectedPage"
        );

        req.session.currentPage = "pyi-technical-unrecoverable";
        return res.redirect(req.session.currentPage);
      }

      switch (pageId) {
        case "page-ipv-debug":
          return res.redirect("/debug");
        case "page-ipv-identity-start":
        case "page-ipv-success":
        case "page-pre-kbv-transition":
        case "page-dcmaw-success":
        case "page-passport-doc-check":
        case "page-multiple-doc-check":
        case "pyi-kbv-fail":
        case "pyi-kbv-thin-file":
        case "pyi-no-match":
        case "pyi-technical":
        case "pyi-technical-unrecoverable":
          return res.render(`ipv/${sanitize(pageId)}.njk`, {
            pageId,
            csrfToken: req.csrfToken(),
          });
        case "page-persist-identity": {
          let userDetailsResponse = {};

          if (req.session.isDebugJourney) {
            userDetailsResponse = samplePersistedUserDetails;
          } else {
            userDetailsResponse = await getAxios(req).get(
              `${API_BASE_URL}${API_BUILD_PROVEN_USER_IDENTITY_DETAILS}`,
              generateAxiosConfig(req)
            );
          }

          const userDetails = {
            name: userDetailsResponse.data?.name,
            dateOfBirth: userDetailsResponse.data?.dateOfBirth,
            addressDetails: generateHTMLofAddress(
              userDetailsResponse.data?.addressDetails
            ),
          };

          return res.render(`ipv/${sanitize(pageId)}.njk`, {
            userDetails,
            pageId,
            csrfToken: req.csrfToken(),
          });
        }
        default:
          return res.render(`ipv/pyi-technical.njk`);
      }
    } catch (error) {
      transformError(error, `error handling journey page: ${req.params}`);
      next(error);
    }
  },
  handleJourneyAction: async (req, res, next) => {
    try {
      if (req.body?.journey === "end") {
        await handleJourneyResponse(req, res, "journey/end");
      } else {
        await handleJourneyResponse(req, res, "journey/next");
      }
    } catch (error) {
      transformError(error, "error invoking handleJourneyAction");
      next(error);
    }
  },
  handleJourneyResponse,
  handleBackendResponse,
};
