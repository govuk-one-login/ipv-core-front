const {
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
  API_CRI_CALLBACK,
  API_SESSION_INITIALISE,
  API_BASE_URL,
  API_JOURNEY_EVENT,
} = require("../lib/config");

const { createAxiosInstance } = require("../app/shared/axiosHelper");

const axiosInstance = createAxiosInstance(API_BASE_URL);

function generateAxiosConfig(req) {
  return {
    headers: {
      "content-type": "application/json",
      "x-request-id": req.id,
      "ip-address": req.session.ipAddress,
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
  const queryParams = generateAxiosConfig(req);

  if (currentPage) {
    queryParams.params = { currentPage };
  }

  return axiosInstance.post(`${API_JOURNEY_EVENT}/${event}`, {}, queryParams);
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
