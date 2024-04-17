const {
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
  API_CRI_CALLBACK,
  API_SESSION_INITIALISE,
  API_BASE_URL,
  API_JOURNEY_EVENT,
} = require("../lib/config");

const { createAxiosInstance } = require("../app/shared/axiosHelper");
const path = require("path");

const axiosInstance = createAxiosInstance(API_BASE_URL);

function generateAxiosConfig(req) {
  return {
    headers: {
      "content-type": "application/json",
      "x-request-id": req.id,
      "ip-address": req.ip || "unknown",
      "feature-set": req.session.featureSet,
      ...(req.session.ipvSessionId && {
        "ipv-session-id": req.session.ipvSessionId,
      }),
      ...(req.session.clientOauthSessionId && {
        "client-session-id": req.session.clientOauthSessionId,
      }),
    },
    logger: req.log,
  };
}

function postJourneyEvent(req, event, currentPage) {
  const requestConfig = generateAxiosConfig(req);

  if (currentPage) {
    requestConfig.params = { currentPage };
  }

  return axiosInstance.post(
    path.join(API_JOURNEY_EVENT, event),
    {},
    requestConfig,
  );
}

function postSessionInitialise(req, authParams) {
  return axiosInstance.post(
    API_SESSION_INITIALISE,
    authParams,
    generateAxiosConfig(req),
  );
}

function postCriCallback(req, body, errorDetails) {
  return axiosInstance.post(
    API_CRI_CALLBACK,
    { ...body, ...errorDetails },
    generateAxiosConfig(req),
  );
}

function getProvenIdentityUserDetails(req) {
  return axiosInstance.get(
    API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
    generateAxiosConfig(req),
  );
}

module.exports = {
  postJourneyEvent,
  postSessionInitialise,
  postCriCallback,
  getProvenIdentityUserDetails,
};
