module.exports = {
  generateAxiosConfig: (req) => {
    const logger = req.log;
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": req.session?.ipvSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
        "feature-set": req.session.featureSet,
      },
      logger,
    };
  },
  generateAxiosConfigWithClientSessionId: (req) => {
    const logger = req.log;
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": req.session?.ipvSessionId,
        "client-session-id": req?.session?.clientOauthSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
        "feature-set": req.session.featureSet,
      },
      logger,
    };
  },
  generateJsonAxiosConfig: (req) => {
    const logger = req.log;
    return {
      headers: {
        "Content-Type": "application/json",
        "ipv-session-id": req.session?.ipvSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
        "feature-set": req.session.featureSet,
      },
      logger,
    };
  },
};
