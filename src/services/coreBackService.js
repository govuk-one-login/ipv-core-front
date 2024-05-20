const {
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
  API_CRI_CALLBACK,
  API_SESSION_INITIALISE,
  API_BASE_URL,
  API_JOURNEY_EVENT,
} = require("../lib/config");

const {
  createPersonalDataHeaders,
} = require("@govuk-one-login/frontend-passthrough-headers");

const { createAxiosInstance } = require("../app/shared/axiosHelper");

const axiosInstance = createAxiosInstance(API_BASE_URL);

function generateAxiosConfig(url, req) {
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
      ...createPersonalDataHeaders(url, req),
    },
    logger: req.log,
  };
}

function postJourneyEvent(req, event, currentPage) {
  const requestConfig = generateAxiosConfig(
    `${API_BASE_URL}${API_JOURNEY_EVENT}/${event}`,
    req,
  );

  if (currentPage) {
    requestConfig.params = { currentPage };
  }

  return axiosInstance.post(`${API_JOURNEY_EVENT}/${event}`, {}, requestConfig);
}

function postSessionInitialise(req, authParams) {
  return axiosInstance.post(
    API_SESSION_INITIALISE,
    authParams,
    generateAxiosConfig(`${API_BASE_URL}${API_SESSION_INITIALISE}`, req),
  );
}

function postCriCallback(req, body, errorDetails) {
  return axiosInstance.post(
    API_CRI_CALLBACK,
    { ...body, ...errorDetails },
    generateAxiosConfig(`${API_BASE_URL}${API_CRI_CALLBACK}`, req),
  );
}

function getProvenIdentityUserDetails(req) {
  return axiosInstance.get(
    API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
    generateAxiosConfig(
      `${API_BASE_URL}${API_BUILD_PROVEN_USER_IDENTITY_DETAILS}`,
      req,
    ),
  );
}

module.exports = {
  postJourneyEvent,
  postSessionInitialise,
  postCriCallback,
  getProvenIdentityUserDetails,
};
