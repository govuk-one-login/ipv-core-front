const {
  API_BASE_URL,
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
  API_CRI_CALLBACK,
  API_SESSION_INITIALISE,
} = require("../lib/config");
const https = require("https");
const axios = require("axios");

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  httpsAgent: new https.Agent({ keepAlive: true }),
});

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

function generateAxiosConfig(req) {
  return {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "ipv-session-id": req.session?.ipvSessionId,
      "x-request-id": req.id,
      "ip-address": req.session.ipAddress,
      "feature-set": req.session.featureSet,
    },
  };
}
function generateAxiosConfigWithClientSessionId(req) {
  return {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "ipv-session-id": req.session?.ipvSessionId,
      "client-session-id": req?.session?.clientOauthSessionId,
      "x-request-id": req.id,
      "ip-address": req.session.ipAddress,
      "feature-set": req.session.featureSet,
    },
  };
}
function generateJsonAxiosConfig(req) {
  return {
    headers: {
      "Content-Type": "application/json",
      "ipv-session-id": req.session?.ipvSessionId,
      "x-request-id": req.id,
      "ip-address": req.session.ipAddress,
      "feature-set": req.session.featureSet,
    },
  };
}

module.exports = {
  postAction,
  postSessionInitialise,
  postCriCallback,
  getProvenIdentityUserDetails,
};
