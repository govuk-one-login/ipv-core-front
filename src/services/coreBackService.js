const {
  API_BASE_URL,
  API_BUILD_PROVEN_USER_IDENTITY_DETAILS,
  API_CRI_CALLBACK,
  API_SESSION_INITIALISE,
} = require("../lib/config");
const https = require("https");
const axios = require("axios");

class CoreBackService {
  constructor() {
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({ keepAlive: true }),
    });
  }

  postAction(req, action) {
    return this.axiosInstance.post(
      `${API_BASE_URL}/${action}`,
      {},
      req.session?.clientOauthSessionId
        ? this.generateAxiosConfigWithClientSessionId(req)
        : this.generateAxiosConfig(req),
    );
  }

  postSessionInitialise(req, authParams) {
    return this.axiosInstance.post(
      `${API_BASE_URL}${API_SESSION_INITIALISE}`,
      authParams,
      {
        headers: {
          "ip-address": req.session.ipAddress,
          "feature-set": req.session.featureSet,
        },
      },
    );
  }

  postCriCallback(req, body, errorDetails) {
    return this.axiosInstance.post(
      `${API_BASE_URL}${API_CRI_CALLBACK}`,
      { ...body, ...errorDetails },
      this.generateJsonAxiosConfig(req),
    );
  }

  getProvenIdentityUserDetails(req) {
    return this.axiosInstance.get(
      `${API_BASE_URL}${API_BUILD_PROVEN_USER_IDENTITY_DETAILS}`,
      this.generateAxiosConfig(req),
    );
  }

  generateAxiosConfig(req) {
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
  generateAxiosConfigWithClientSessionId(req) {
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
  generateJsonAxiosConfig(req) {
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
}

module.exports = {
  CoreBackService,
};
