module.exports = {
  generateAxiosConfig: (req) => {
    return {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ipv-session-id": req.session?.ipvSessionId,
        "client-oauth-session-id": req?.session?.clientOauthSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
      },
    };
  },
  generateJsonAxiosConfig: (req) => {
    return {
      headers: {
        "Content-Type": "application/json",
        "ipv-session-id": req.session?.ipvSessionId,
        "x-request-id": req.id,
        "ip-address": req.session.ipAddress,
        "client-oauth-session-id": req?.session?.clientOauthSessionId,
      },
    };
  },
};
