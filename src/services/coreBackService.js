const {
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
  API_CRI_CALLBACK,
  API_SESSION_INITIALISE,
  API_BASE_URL,
} = require("../lib/config");

const {
  generateAxiosConfig,
  generateAxiosConfigWithClientSessionId,
  generateJsonAxiosConfig,
  createAxiosInstance,
} = require("../app/shared/axiosHelper");

const axiosInstance = createAxiosInstance(API_BASE_URL);

function postAction(req, action) {
  return axiosInstance.post(
    `/${action}`,
    {},
    req.session?.clientOauthSessionId
      ? generateAxiosConfigWithClientSessionId(req)
      : generateAxiosConfig(req),
  );
}

function postSessionInitialise(req, authParams) {
  return axiosInstance.post(API_SESSION_INITIALISE, authParams, {
    headers: {
      "ip-address": req.session.ipAddress,
      "feature-set": req.session.featureSet,
    },
    logger: req.log,
  });
}

function postCriCallback(req, body, errorDetails) {
  return axiosInstance.post(
    API_CRI_CALLBACK,
    { ...body, ...errorDetails },
    generateJsonAxiosConfig(req),
  );
}

function getProvenIdentityUserDetails(req) {
  return axiosInstance.get(
    API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
    generateAxiosConfig(req),
  );
}

module.exports = {
  postAction,
  postSessionInitialise,
  postCriCallback,
  getProvenIdentityUserDetails,
};
